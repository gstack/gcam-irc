window.gcam = window.gcam || {};

gcam.ui = {};
gcam.ui.masonry = {};

gcam.ui.masonry.update = function() {
  console.log('cams relayout');
}

gcam.SETTINGS_DISABLED = false;

gcam.currentUsername = "gray";
gcam.currentChannel = "";

gcam.CAM_SIZES = [
        [160, 165],
        [280,240],
        [320, 280],
        [420, 300],
        [180, 140]
];

gcam.addEventListeners = function() {
  /* IRC Events */
  window.gcamEvents.addListener('adduser', function(data) { console.log('g:adduser'); console.dir(data); }); 
  window.gcamEvents.addListener('removeuser', function(data) { console.log('g:removeuser'); console.dir(data); }); 
  window.gcamEvents.addListener('msg', function(data) { console.log('g:msg'); console.dir(data); });
  window.gcamEvents.addListener('setactive', function(data) { console.log('g:setactive'); console.dir(data); });
  window.gcamEvents.addListener('stoppedbroadcasting', function(data) { console.log('g:stoppedbroadcasting'); console.dir(data); });
  window.gcamEvents.addListener('startedbroadcasting', function(data) { console.log('g:startedbroadcasting'); console.dir(data); });
  
  /* Post-parse Events */
  
  console.log('added gcam video chat event listeners');
}

// called when height is updated to generate nice looking cams
function regenCamSizes(){
        gcam.CAM_SIZES = [];
}

gcam.current_camsize = 1;

gcam.ui.colWidth = gcam.CAM_SIZES[gcam.current_camsize][0]; // current width of a cam
gcam.ui.colHeight = gcam.CAM_SIZES[gcam.current_camsize][1];

// callbacks from flash
gcam.cams_channel = {
  onStartedBroadcasting: function(streamName) {
    window.gcamEvents.emit('startedbroadcasting', {stream: this.streamName});
  }
};

function getNewGid()
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 5; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function getNewSid()
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 10; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text.toUpperCase();
}

gcam.hello = function(gid)
{
	// cam ready handler
	for (var i=0;i<gcam.activeCams.length;i++)
	{
		if (gcam.activeCams[i].id == gid)
		{
			var cam = gcam.activeCams[i];
			cam.ready = true;
			cam.obj = document.getElementById("AS3Cam_"+gid);
			cam.callback();
		}
	}
};

(function(gcam){

	// active management for all cam slots (publish, stop, global mute, add 1, etc) -- hooks into gcam.ui for layout
	var CamSlotManager = function()
	{
		this.currentCamslots = 0;
		this.totalCamslots = 16; // most people that can ever be streaming at once (will change later)
		this.camslots = [];
		this.streamName = ""; // current client's stream name
		this.currentlyBroadcasting = false;
	}

	// add a STREAM (i.e. viewing somebody else)
	CamSlotManager.prototype.addStream = function(data, name)
	{
		var cam = new GcamSwf(320, 240, 'view', name, function(){
			// cam is now ready for use
			console.log(cam.obj);
			window.cam = cam;
		}, null, data);

		cam.user = data;
		cam.nname = name;

		this.camslots.push(cam);
		gcam.ui.masonry.update();
	};

	CamSlotManager.prototype.stopStreaming = function()
	{
		$("#start_broadcasting").show();
		$("#stop_broadcasting").hide();

		//gcam.cams_channel.onStoppedBroadcasting(this.streamName);
    window.gcamEvents.emit('stoppedbroadcasting', {stream: this.streamName});

		this.currentlyBroadcasting = false;
		this.streamName = "";

		if (this.streamingCam != null) this.remove(this.streamingCam);
	}

	CamSlotManager.prototype.tryRemove = function(cl)
	{
		for (var i=0;i<gcam.activeCams.length;i++)
		{
			var cam = gcam.activeCams[i];
			if (cam.stream == cl.stream)
			{
				this.remove(cam);
			}
		}
	}

	CamSlotManager.prototype.remove = function(cam)
	{
		cam.destroy();
		this.camslots = this.camslots.remove(cam);
		gcam.activeCams = gcam.activeCams.remove(cam);

		gcam.ui.masonry.update();
	}

	// add a BROADCAST (broadcast myself)
	CamSlotManager.prototype.startStream = function()
	{
		$("#start_broadcasting").hide();
		$("#stop_broadcasting").show();

		if (this.currentlyBroadcasting || this.streamName != "") { this.stopStreaming(); return; }

		this.currentlyBroadcasting = true;

		this.streamName = getNewSid();

		var cam = new GcamSwf(320, 240, 'broadcast', this.streamName, function(){
			// cam is now ready for use (once broadcast starts the as3 will automatically propogate event to the cams_channel
			console.log(cam.obj);
			window.cam = cam;
		});

		this.streamingCam = cam;

		this.camslots.push(cam);
		gcam.ui.masonry.update();
	};

	gcam.camslots = new CamSlotManager();
	gcam.resetCamslots = function()
	{
		gcam.camslots = new CamSlotManager();
	}

})(window.gcam);

(function(g){

	gcam.activeCams = [];

	// var cam = new GcamSwf(320, 240, 'broadcast', 'gray');
	var GcamSwf = function(width, height, type, streamName, ready, selector, cl)
	{
		this.id = getNewGid();
		this.container = "cambox_inner_"+this.id;
		this.type = type;

		/* this.width = width;
		this.height = height; */

		this.width = gcam.CAM_SIZES[gcam.current_camsize][0];
		this.height = gcam.CAM_SIZES[gcam.current_camsize][1];

		this.isBroadcasting = false;

		this.stream = streamName;

		if (cl != null)
		{
			this.cl = cl;
			this.username = cl.name;
		}
		else
		{
			this.username = gcam.currentUsername;
		}

		if (ready != null) this.onReady = ready;

		if (selector == null)
		{
			this.el = $("<div id='cambox_"+this.id+"' class='videobox'><div class='titlebar'><span><strong>"+this.username+"</span></strong><div class='videocontrols'><i class='settings'></i></div></div><div class='videobox-flash'></div></div>");
			$(".videocams").append(this.el);
		}
		else
		{
			this.el = jQuery(selector)[0];
		}

		// $("#cambox_"+this.id).
		$("#cambox_"+this.id).css('width', this.width+'px');
		$("#cambox_"+this.id).css('height', this.height+'px');

		// this gets replaced
		var innerEl = $("<div id='"+this.container+"'>");
		$(this.el).find('.videobox-flash').append(innerEl);

		$($("#cambox_"+this.id).find('.videocontrols')).click(this.menuCallback.bind(this));

		this.ready = false;
		this.callbackInitial = false;

		this.createSwf(this.id);
		gcam.activeCams.push(this);
	}

	GcamSwf.prototype.menuCallback = function()
	{
		console.log('cambox '+this.username+' menu callback..');
		gcam.ui.showCamboxMenu($("#cambox_"+this.id).find('.videocontrols'));
	}

	GcamSwf.prototype.refresh = function()
	{
		console.log(" -- refreshing cam "+this.username+" -- ");
		this.destroy();
		gcam.camslots.addStream(this.user, this.nname);
	}

	GcamSwf.prototype.callback = function()
	{
		// camera is ready callback
		console.log('camera slot '+this.id+' is ready to use.');
		console.dir(this);

		if (this.callbackInitial) this.start();
		if (this.onReady != null) this.onReady();

		if (this.callbackInitial == false) setTimeout(this.callback.bind(this), 1000); // flash player lag compensation
		//window.fp_ready_callback = this.callback.bind(this);
		this.callbackInitial = true;
	}

	GcamSwf.prototype.destroy = function()
	{
		this.el.remove();
	}

	GcamSwf.prototype.start = function()
	{
	//	this.callbackInitial = false;

		if (this.type == "broadcast")
		{
			this.obj.startBroadcasting(this.stream);
		}
		else if (this.type == "view")
		{
			this.obj.startViewing(this.stream);
		}
		else if (this.type == "mirror")
		{
			this.obj.startMirror();
		}
		else
		{
			console.log('invalid cam type '+this.type);
		}
	}

	GcamSwf.prototype.createSwf = function(id)
	{
		var swfVersionStr = "11.4.0";
		// To use express install, set to playerProductInstall.swf, otherwise the empty string.
		var xiSwfUrlStr = "playerProductInstall.swf";
		var flashvars = {
			"gid": id
		};
		var params = {
			"wmode": "direct"
		};
		params.quality = "high";
		params.bgcolor = "#000000"; // may want to change this in production
		params.allowscriptaccess = "always";
		params.allowfullscreen = "true";

		var attributes = {};
		attributes.id = "AS3Cam_"+id;
		attributes.name = "AS3Cam_"+id;
		attributes.align = "middle";
		swfobject.embedSWF("/assets/AS3Cam.swf", this.container, "100%", "100%", swfVersionStr, xiSwfUrlStr, flashvars, params, attributes);
		swfobject.createCSS("#"+this.container, "display:block;text-align:left;");
	}

	g.GcamSwf = GcamSwf;

})(window);
