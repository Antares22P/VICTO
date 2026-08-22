import React from "react";

function BottomSection({
  followMe,
  setFollowMe,
  goToMyLocation,
  fitAllMembers,
  copyInviteLink,
  selectedDestination,
  saveDestination,
  cancelDestination,
}) {
  return (
    <>
      {/* ==================================================
          DESTINATION ACTIONS
      ================================================== */}

      {selectedDestination && (
        <div className="destination-actions">
          <button
            className="destination-save"
            onClick={saveDestination}
          >
            📍 Set Destination
          </button>

          <button
            className="destination-cancel"
            onClick={cancelDestination}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* ==================================================
          BOTTOM CONTROLS
      ================================================== */}

      <div className="bottom-controls">

        {/* ----------------------------------------------
            MY LOCATION
        ---------------------------------------------- */}

        <button
          className="control-button"
          onClick={goToMyLocation}
        >
          ◎ My Location
        </button>

        {/* ----------------------------------------------
            FIT ALL MEMBERS
        ---------------------------------------------- */}

        <button
          className="control-button"
          onClick={fitAllMembers}
        >
          ⛶ Fit All
        </button>

        {/* ----------------------------------------------
            FOLLOW ME
        ---------------------------------------------- */}

        <button
          className={
            followMe
              ? "control-button active"
              : "control-button"
          }
          onClick={() =>
            setFollowMe((previous) => !previous)
          }
        >
          {followMe
            ? "◉ Following"
            : "◎ Follow"}
        </button>

        {/* ----------------------------------------------
            INVITE
        ---------------------------------------------- */}

        <button
          className="control-button primary"
          onClick={copyInviteLink}
        >
          + Invite
        </button>

      </div>
    </>
  );
}

export default BottomSection;