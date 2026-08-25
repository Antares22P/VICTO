import React from "react";
import "./room.css";


function BottomSection({
  followMe,
  setFollowMe,
  meshEnabled,
  setMeshEnabled,
  goToMyLocation,
  fitAllMembers,
  copyInviteLink,
  selectedDestination,
  saveDestination,
  cancelDestination,
}) {
  return (
    <>
    
      {selectedDestination && (
        <div className="destination-actions">
          <button className="destination-save" onClick={saveDestination}>
            📍 Set Destination
          </button>

          <button className="destination-cancel" onClick={cancelDestination}>
            ✕ Cancel
          </button>
        </div>
      )}

 

      <div className="bottom-controls">


        <button className="control-button" onClick={goToMyLocation}>
          ◎ My Location
        </button>

        

        <button className="control-button" onClick={fitAllMembers}>
          ⛶ Fit All
        </button>

        

        <button
          className={followMe ? "control-button active" : "control-button"}
          onClick={() => setFollowMe((previous) => !previous)}
        >
          {followMe ? "◉ Following" : "◎ Follow"}
        </button>

    

        <button
          className={
            meshEnabled ? "control-button active mesh-active" : "control-button"
          }
          onClick={() => setMeshEnabled((previous) => !previous)}
        >
          {meshEnabled ? "◉ Mesh" : "◎ Mesh"}
        </button>

    

        <button className="control-button primary" onClick={copyInviteLink}>
          + Invite
        </button>
      </div>
    </>
  );
}

export default BottomSection;
