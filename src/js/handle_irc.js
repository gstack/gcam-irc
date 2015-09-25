var _ = typeof _ !== 'undefined' ? _ : require("underscore");
var util = typeof util !== 'undefined' ? util : {};

/*!
 * EventEmitter v4.2.11 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */
(function(){"use strict";function t(){}function i(t,n){for(var e=t.length;e--;)if(t[e].listener===n)return e;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var e=t.prototype,r=this,s=r.EventEmitter;e.getListeners=function(n){var r,e,t=this._getEvents();if(n instanceof RegExp){r={};for(e in t)t.hasOwnProperty(e)&&n.test(e)&&(r[e]=t[e])}else r=t[n]||(t[n]=[]);return r},e.flattenListeners=function(t){var e,n=[];for(e=0;e<t.length;e+=1)n.push(t[e].listener);return n},e.getListenersAsObject=function(n){var e,t=this.getListeners(n);return t instanceof Array&&(e={},e[n]=t),e||t},e.addListener=function(r,e){var t,n=this.getListenersAsObject(r),s="object"==typeof e;for(t in n)n.hasOwnProperty(t)&&-1===i(n[t],e)&&n[t].push(s?e:{listener:e,once:!1});return this},e.on=n("addListener"),e.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},e.once=n("addOnceListener"),e.defineEvent=function(e){return this.getListeners(e),this},e.defineEvents=function(t){for(var e=0;e<t.length;e+=1)this.defineEvent(t[e]);return this},e.removeListener=function(r,s){var n,e,t=this.getListenersAsObject(r);for(e in t)t.hasOwnProperty(e)&&(n=i(t[e],s),-1!==n&&t[e].splice(n,1));return this},e.off=n("removeListener"),e.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},e.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},e.manipulateListeners=function(r,t,i){var e,n,s=r?this.removeListener:this.addListener,o=r?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(e=i.length;e--;)s.call(this,t,i[e]);else for(e in t)t.hasOwnProperty(e)&&(n=t[e])&&("function"==typeof n?s.call(this,e,n):o.call(this,e,n));return this},e.removeEvent=function(e){var t,r=typeof e,n=this._getEvents();if("string"===r)delete n[e];else if(e instanceof RegExp)for(t in n)n.hasOwnProperty(t)&&e.test(t)&&delete n[t];else delete this._events;return this},e.removeAllListeners=n("removeEvent"),e.emitEvent=function(r,o){var e,i,t,s,n=this.getListenersAsObject(r);for(t in n)if(n.hasOwnProperty(t))for(i=n[t].length;i--;)e=n[t][i],e.once===!0&&this.removeListener(r,e.listener),s=e.listener.apply(this,o||[]),s===this._getOnceReturnValue()&&this.removeListener(r,e.listener);return this},e.trigger=n("emitEvent"),e.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},e.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},e._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},e._getEvents=function(){return this._events||(this._events={})},t.noConflict=function(){return r.EventEmitter=s,t},"function"==typeof define&&define.amd?define(function(){return t}):"object"==typeof module&&module.exports?module.exports=t:r.EventEmitter=t}).call(this);

var g = typeof window !== 'undefined' ? window : global;
g.gcamEvents = new EventEmitter();

util.handle_irc = function(message, irc, app_ref) {
  var app = typeof window !== 'undefined' ? window.app : app_ref;
  var conn = irc.get("connections");

  // Alias the long namespace
  var server = conn.get(message.client_server);

  // For debugging purposes
  if (message.rawCommand !== "PING") {
    console.log(message);
  }

  switch (message.rawCommand) {
    // We ignore PING messages - in the future
    // maybe we these are important for timeout purposes?
    case "PING":
      break;

    case "NOTICE":
      // If our app is not initialized we need to start it now
      if (!app.initialized && message.client_server) {
        app.initialized = true;

        app.irc.set({
          active_server: message.client_server,
          active_channel: "status"
        });

        conn.addServer(message.client_server);

        // We a status channel for our new connection
        conn.first().addChannel("status");

        if (typeof module === 'undefined') {
          $(".mainMenu").addClass("hide");

          var irc = new app.components.irc({
            collection: conn
          });
          irc.show();
        }

      } else {
        if(conn.get(message.client_server) === undefined) {
          conn.addServer(message.client_server);
          server = conn.get(message.client_server);
          app.irc.set({
            active_server: message.client_server,
            active_channel: "status"
          });
        }
        server.addMessage("status", {from: "", text: message.args[1], type: "NOTICE"});
      }
      break;

    case "PRIVMSG":
      // If we have a message addressed to a server
      if (message.args[0][0] === "#") {
        server.addMessage(message.args[0], {from: message.nick, text: message.args[1], type: "PRIVMSG"});
        window.gcamEvents.emit('msg', {from: message.nick, text: message.args[1], type: "PRIVMSG"});
      } else {
        // Deal with a private message
        server.addMessage(message.nick, {from: message.nick, text: message.args[1], type: "PRIVMSG"});
      }
      break;

    case "MODE":
      if (message.args[0].indexOf("#") === 0) {
        var channel = server.get("channels").get(message.args[0]);
        server.addMessage(channel.get("name"), {from: message.nick, text: message.args[2], mode: message.args[1], type: "MODE"});
        switch (message.args[1]) {
          case "+o":
            channel.get("users").get(message.args[2]).set("type", "@");
            break;
          case "-o":
            channel.get("users").get(message.args[2]).set("type", "");
            break;
          default:
            break;
        }
      } else {
        //user mode message
        var user = message.args[0];
      }
      break;

    case "JOIN":
      // The first argument is the name of the channel
      if(message.nick === app.irc.getActiveNick()) {
        server.addChannel(message.args[0]);
        if (message.args[0].indexOf("-gcam") == -1)
        {
          app.irc.set("active_channel", message.args[0]);
          app.io.emit("command", {server: "irc.rizon.net", command: "join "+message.args[0]+"-gcam"});
          console.log('joining cams channel:'+message.args[0]+"-gcam");
        } else {
          console.log('joined cams channel: '+message.args[0]);
        }
          
        conn.trigger("sort");
      } else {
        server.addMessage(message.args[0], {type: "JOIN", nick: message.nick});
        var channel = server.get("channels").get(message.args[0]);
        channel.get("users").add({nick: message.nick});
        window.gcamEvents.emit('adduser', {from: message.args[0], nick: message.nick});
      }
      break;

    case "PART":
      if(message.nick === server.get("nick")) {
        server.get("channels").remove(message.args[0]);
        app.irc.set("active_channel", "status");
        conn.trigger("sort");
      } else {
        var channel = server.get("channels").get(message.args[0]);
        server.addMessage(message.args[0], {type: "PART", nick: message.nick, text: message.args[1]});
        channel.get("users").remove(message.nick);
        window.gcamEvents.emit('removeuser', {from: message.args[0], nick: message.nick});
      }
      break;

    case "QUIT":
      server.get("channels").map(function(channel) {
        if (channel.get("users").get(message.nick)) {
          server.addMessage(channel.get("name"), {type: "QUIT", nick: message.nick, text: message.args[0]});
          channel.get("users").remove(message.nick);
        }
      });
      break;

    case "KICK":
      if(message.args[1] === server.get("nick")) {
        server.get("channels").remove(message.args[0]);
        app.irc.set("active_channel", "status");
        server.addMessage('status', {type: "KICK", nick: message.nick, text: message.args[1], reason: message.args[2]});
        conn.trigger("sort");
      } else {
        var channel = server.get("channels").get(message.args[0]);
        server.addMessage(message.args[0], {type: "KICK", nick: message.nick, text: message.args[1], reason: message.args[2]});
        channel.get("users").remove(message.args[1]);
      }
      break;


    case "TOPIC":
      server.addMessage(message.args[0], {type: "TOPIC", nick: message.nick, text: message.args[1]});

      var channel = server.get("channels").get(message.args[0]);
      channel.set("topic", message.args[1]);
      break;

    case "NICK":
      var isMe = false;
      // If it was us that changed our nick we want to change it here
      if (server.get("nick") === message.nick) {
        server.set("nick", message.args[0]);
        isMe = true;
        server.addMessage("status", {type: "NICK", nick: message.nick, text: message.args[0]});
      }

      // for each channel we are in
      // we want to change the nick of the user that has the new nick
      server.get("channels").map(function(channel) {
        var user = channel.get("users").get(message.nick);
        if (channel.get("users").get(message.nick)){
          user.set("nick", message.args[0]);
          if (!isMe) {
            server.addMessage(channel.get("name"), {type: "NICK", nick: message.nick, text: message.args[0]});
          }
        }
      });
      break;

    case "001":
      server.set({nick: _.first(message.args)});
      server.addMessage("status", {text: message.args[1], type: "NOTICE"});

      server.get("channels").each(function(channel) {
        if (channel.get("name").indexOf("#") !== -1) {
          server.get("channels").remove(channel.get("name"));
        }
      });
      break;

    case "002":
      server.addMessage("status", {text: message.args.join(" "), type: "NOTICE"});
      break;

    case "256":
    case "257":
    case "258":
    case "259":
    case "371":
      server.addMessage("status", {text: message.args[1], type: "NOTICE"});
      break;

    case "321":
      // rpl_liststart
      // args are username/channel/usersname
      server._list_store = [];
      break;

    case "322":
      server._list_store.push({
        channel: message.args[1],
        users: message.args[2],
        topic: message.args[3]
      });
      break;

    case "323":
      server.get("list").reset(server._list_store);
      server._list_store = [];
      break;

    // Set the topic
    case "332":
      server.get("channels").get(message.args[1]).set("topic", message.args[2]);
      break;

    case "333":
      // This has the topic user and the topic creation date
      // args [0: user 1: channel 2: user who set topic 3: topic timestamp]
      break;

    case "353":
      // We have to trim for leading and trailing whitespace
      var usernames = message.args[3].trim().split(" ");
      usernames = _.map(usernames, function(u) {
        return {nick: u};
      });
      server.addUser(message.args[2], usernames);
      break;

    case "372":
      server.set("motd", server.get("motd") + "\n" + message.args[1]);
      break;

    case "375":
      server.set("motd", message.args[1]);
      break;

    case "376":
      server.addMessage("status", {text: server.get("motd"), specialType: "MOTD"});
      break;

    case "433":
      server.addMessage("status", {text: "Error " + message.args.join(" ")});
      break;

    case "474":
      server.addMessage("status", {text: message.args[1] + " " + message.args[2]});
      break;

    default:
      // Generic handler for irc errors
      if (message.commandType === "irc_error") {
        server.addMessage("status", {text: message.args.join(" - ")});
      }
      break;
  }
}

// to export our models code to work server side
if (typeof module !== 'undefined' && module.exports) {
  module.exports = util.handle_irc;
}
