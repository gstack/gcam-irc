/** @jsx React.DOM */

app.components.video_cams = function() {
  var CamSlot = React.createBackboneClass({
    render: function() {
      return (
        <div className="videobox">
          <div className="titlebar">
            <span><strong>{this.getModel().get("type")}{this.getModel().get("nick")}</strong></span>
            <div className="videocontrols">
              <i className="settings"></i>
            </div>
          </div>
          <div className="videobox-flash">
          </div>
        </div>
      )
    }
  });

  var VideoCams = React.createBackboneClass({
    render: function() {
      return (
        <div className="videocams-grid">
          {this.getModel().sortAll().map(function(user) {
            return <CamSlot model={user} />
          })}
        </div>
      );
    }
  });

  return { VideoCams: VideoCams, CamSlot: CamSlot };
};