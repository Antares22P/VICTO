import { useEffect, useState, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";

import { ref, onValue } from "firebase/database";
import { database } from "./firebase";

import "leaflet/dist/leaflet.css";
import "./room.css";

import BottomSection from "./BottomSection";

const API_URL = import.meta.env.VITE_API_URL;

// ======================================================
// AVATAR
// ======================================================

function getInitialAvatar(name) {
  const emojis = [
    "😀",
    "😎",
    "🤖",
    "👽",
    "🦊",
    "🐼",
    "🐯",
    "🐸",
    "🦁",
    "🐵",
    "🐨",
    "🐙",
    "🦄",
    "🐲",
    "👻",
  ];

  if (!name) {
    return emojis[0];
  }

  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return emojis[Math.abs(hash) % emojis.length];
}

// ======================================================
// MEMBER AVATAR
// ======================================================

function MemberAvatar({ member, size = 34 }) {
  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "#202938",
    border: "1px solid #374151",
    fontSize: `${size * 0.5}px`,
  };

  if (member?.profileImage) {
    return (
      <div style={avatarStyle}>
        <img
          src={member.profileImage}
          alt={member.name || "Member"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }

  return (
    <div style={avatarStyle}>
      {getInitialAvatar(member?.name)}
    </div>
  );
}

// ======================================================
// MAP CLICK HANDLER
// ======================================================

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

// ======================================================
// RECENTER / FOLLOW MAP
// ======================================================

function RecenterMap({ members, memberId, followMe }) {
  const map = useMap();
  const hasCentered = useRef(false);

  // ----------------------------------------------------
  // FIRST LOCATION CENTER
  // ----------------------------------------------------

  useEffect(() => {
    const me = members[memberId];

    if (!me?.location) {
      return;
    }

    const lat = Number(me.location.lat);
    const lng = Number(me.location.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    if (!hasCentered.current) {
      const timer = setTimeout(() => {
        if (!map || !map.getContainer()) {
          return;
        }

        map.setView([lat, lng], 15, {
          animate: false,
        });

        hasCentered.current = true;
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [members, memberId, map]);

  // ----------------------------------------------------
  // FOLLOW MY LOCATION
  // ----------------------------------------------------

  useEffect(() => {
    if (!followMe) {
      return;
    }

    const me = members[memberId];

    if (!me?.location) {
      return;
    }

    const lat = Number(me.location.lat);
    const lng = Number(me.location.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    if (!map || !map.getContainer()) {
      return;
    }

    map.setView([lat, lng], map.getZoom(), {
      animate: true,
    });
  }, [members, memberId, followMe, map]);

  // ----------------------------------------------------
  // MY LOCATION BUTTON
  // ----------------------------------------------------

  useEffect(() => {
    const handleRecenter = (event) => {
      const { lat, lng } = event.detail || {};

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      if (!map || !map.getContainer()) {
        return;
      }

      map.flyTo([lat, lng], 16, {
        duration: 0.8,
      });
    };

    window.addEventListener("victo-recenter", handleRecenter);

    return () => {
      window.removeEventListener("victo-recenter", handleRecenter);
    };
  }, [map]);

  return null;
}

// ======================================================
// DISTANCE CALCULATION
// ======================================================

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180;

  const earthRadius = 6371000;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return (
    2 *
    earthRadius *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

// ======================================================
// NEARBY SOUND
// ======================================================

function playNearbySound() {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const context = new AudioContext();

    const playTone = () => {
      const now = context.currentTime;

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(880, now);

      oscillator.frequency.exponentialRampToValueAtTime(
        660,
        now + 0.18
      );

      gain.gain.setValueAtTime(0.0001, now);

      gain.gain.exponentialRampToValueAtTime(
        0.18,
        now + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.22
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.24);

      oscillator.addEventListener("ended", () => {
        context.close().catch(() => {});
      });
    };

    if (context.state === "suspended") {
      context
        .resume()
        .then(playTone)
        .catch(() => {
          context.close().catch(() => {});
        });
    } else {
      playTone();
    }
  } catch (error) {
    console.warn(
      "Nearby notification sound could not play:",
      error
    );
  }
}

// ======================================================
// DESTINATION MARKER
// ======================================================

function DestinationMarker({
  id,
  member,
  memberId,
  onRemove,
}) {
  const markerRef = useRef(null);

  const isOwnDestination = id === memberId;

  const lat = Number(member?.destination?.lat);
  const lng = Number(member?.destination?.lng);

  // ----------------------------------------------------
  // REMOVE BUTTON
  // ----------------------------------------------------

  useEffect(() => {
    const marker = markerRef.current;

    if (!marker) {
      return;
    }

    const element = marker.getElement();

    if (!element) {
      return;
    }

    const button = element.querySelector(
      ".victo-destination-remove"
    );

    if (!button || !isOwnDestination) {
      return;
    }

    const handleRemove = (event) => {
      event.preventDefault();
      event.stopPropagation();

      onRemove(id);
    };

    button.addEventListener("click", handleRemove);

    return () => {
      button.removeEventListener("click", handleRemove);
    };
  }, [id, isOwnDestination, onRemove]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const removeButton = isOwnDestination
    ? `
        <button
          type="button"
          class="victo-destination-remove"
          title="Remove destination"
          aria-label="Remove destination"
        >
          × Remove
        </button>
      `
    : "";

  const destinationTitle = isOwnDestination
    ? "Your Destination"
    : `${member.name}'s Destination`;

  const icon = divIcon({
    className: "victo-destination-icon-wrapper",

    html: `
      <div class="victo-destination-marker">

        <div class="victo-destination-pin">
          <div class="victo-destination-pin-inner"></div>
        </div>

        <div class="victo-destination-label">
          ${destinationTitle}
        </div>

        ${removeButton}

      </div>
    `,

    iconSize: [170, 82],

    iconAnchor: [18, 38],
  });

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click(event) {
          event.originalEvent?.stopPropagation();
        },
      }}
    >
      <Popup>
        <div
          style={{
            minWidth: "150px",
          }}
        >
          <b>{destinationTitle}</b>

          <div
            style={{
              marginTop: "6px",
              fontSize: "11px",
              color: "#6b7280",
              lineHeight: 1.5,
            }}
          >
            {isOwnDestination
              ? "Hover the destination marker to remove it."
              : "Destination shared by this member."}
          </div>

          {isOwnDestination && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(id);
              }}
              style={{
                marginTop: "10px",
                width: "100%",
                border: "0",
                borderRadius: "7px",
                padding: "7px 9px",
                background: "#ef4444",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Remove Destination
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// ======================================================
// ROOM
// ======================================================

function Room() {
  // ====================================================
  // STATE
  // ====================================================

  const [members, setMembers] = useState({});

  const [selectedDestination, setSelectedDestination] =
    useState(null);

  const [followMe, setFollowMe] = useState(false);

  const [selectedMemberId, setSelectedMemberId] =
    useState(null);

  const [selectedMemberRoute, setSelectedMemberRoute] =
    useState(null);

  const [loadingMemberRoute, setLoadingMemberRoute] =
    useState(false);

  const [nearbyNotification, setNearbyNotification] =
    useState(null);

  // Members currently inside 30m.
  // Prevents repeated sounds on every Firebase update.
  const nearbyMembersRef = useRef(new Set());

  // ====================================================
  // LOCAL STORAGE
  // ====================================================

  const roomId = localStorage.getItem("roomId");
  const memberId = localStorage.getItem("memberId");
  const name = localStorage.getItem("name");
  const roomCode = localStorage.getItem("roomCode");

  // ====================================================
  // INVITE LINK
  // ====================================================

  const inviteLink =
    `${window.location.origin}/join/${roomCode}`;

  // ====================================================
  // COPY INVITE LINK
  // ====================================================

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);

      alert("Invite link copied!");
    } catch (error) {
      console.error(error);

      alert("Could not copy invite link");
    }
  };

  // ====================================================
  // FIREBASE - LISTEN TO MEMBERS
  // ====================================================

  useEffect(() => {
    if (!roomId) {
      console.error("Room ID missing");
      return;
    }

    const membersRef = ref(
      database,
      `rooms/${roomId}/members`
    );

    const unsubscribe = onValue(
      membersRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        console.log("Firebase members:", data);

        setMembers(data);
      },
      (error) => {
        console.error(
          "Firebase listener error:",
          error
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // ====================================================
  // NEARBY MEMBER SOUND / NOTIFICATION
  // ====================================================

  useEffect(() => {
    const me = members[memberId];

    if (!me?.location) {
      nearbyMembersRef.current = new Set();
      return;
    }

    const myLat = Number(me.location.lat);
    const myLng = Number(me.location.lng);

    if (
      !Number.isFinite(myLat) ||
      !Number.isFinite(myLng)
    ) {
      return;
    }

    const currentlyNearby = new Set();

    Object.entries(members).forEach(([id, member]) => {
      if (
        id === memberId ||
        !member?.location
      ) {
        return;
      }

      const memberLat = Number(member.location.lat);
      const memberLng = Number(member.location.lng);

      if (
        !Number.isFinite(memberLat) ||
        !Number.isFinite(memberLng)
      ) {
        return;
      }

      const distance = getDistanceMeters(
        myLat,
        myLng,
        memberLat,
        memberLng
      );

      // ==================================================
      // MEMBER IS WITHIN 30 METERS
      // ==================================================

      if (distance <= 30) {
        currentlyNearby.add(id);

        // Only trigger when entering
        // the 30m radius.
        if (!nearbyMembersRef.current.has(id)) {
          const distanceText =
            distance < 1
              ? "less than 1 m"
              : `${Math.round(distance)} m`;

          setNearbyNotification({
            id: `${id}-${Date.now()}`,
            name: member.name || "A member",
            distanceText,
          });

          playNearbySound();

          // Browser notification only if
          // permission has already been granted.
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification("Victo", {
                body:
                  `${member.name || "A member"} ` +
                  `is ${distanceText} away from you.`,
              });
            } catch (error) {
              console.warn(
                "Browser notification failed:",
                error
              );
            }
          }
        }
      }
    });

    nearbyMembersRef.current = currentlyNearby;
  }, [members, memberId]);

  // ====================================================
  // AUTO HIDE NEARBY NOTIFICATION
  // ====================================================

  useEffect(() => {
    if (!nearbyNotification) {
      return;
    }

    const timer = setTimeout(() => {
      setNearbyNotification(null);
    }, 4500);

    return () => {
      clearTimeout(timer);
    };
  }, [nearbyNotification]);

  // ====================================================
  // ONLINE STATUS
  // ====================================================

  useEffect(() => {
    if (!roomId || !memberId) {
      return;
    }

    const updateOnlineStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/member/status` +
            `?roomId=${encodeURIComponent(roomId)}` +
            `&memberId=${encodeURIComponent(memberId)}` +
            `&online=true`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          console.error(
            "Online status error:",
            response.status
          );
        }
      } catch (error) {
        console.error(
          "Heartbeat failed:",
          error
        );
      }
    };

    updateOnlineStatus();

    const interval = setInterval(
      updateOnlineStatus,
      10000
    );

    return () => {
      clearInterval(interval);
    };
  }, [roomId, memberId]);

  // ====================================================
  // SEND MY LIVE LOCATION
  // ====================================================

  useEffect(() => {
    if (!roomId || !memberId) {
      return;
    }

    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            updatedAt: Date.now(),
          };

          console.log("My location:", location);

          try {
            const response = await fetch(
              `${API_URL}/api/location` +
                `?roomId=${encodeURIComponent(roomId)}` +
                `&memberId=${encodeURIComponent(memberId)}`,
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                body: JSON.stringify(location),
              }
            );

            if (!response.ok) {
              console.error(
                "Location API error:",
                await response.text()
              );

              return;
            }

            console.log(
              "Location updated successfully"
            );
          } catch (error) {
            console.error(
              "Location update failed:",
              error
            );
          }
        },

        (error) => {
          console.error(
            "GPS error:",
            error
          );
        },

        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 10000,
        }
      );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [roomId, memberId]);

  // ====================================================
  // SAVE DESTINATION
  // ====================================================

  const saveDestination = async () => {
    if (!selectedDestination) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/destination` +
          `?roomId=${encodeURIComponent(roomId)}` +
          `&memberId=${encodeURIComponent(memberId)}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            lat: selectedDestination.lat,
            lng: selectedDestination.lng,
            name: `${name}'s Destination`,
            updatedAt: Date.now(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save destination"
        );
      }

      console.log("Destination saved");

      alert("Destination set successfully!");

      setSelectedDestination(null);
    } catch (error) {
      console.error(
        "Destination error:",
        error
      );

      alert("Could not set destination");
    }
  };

  // ====================================================
  // REMOVE SAVED DESTINATION
  // ====================================================

  const removeDestination = async (
    destinationMemberId = memberId
  ) => {
    if (!roomId || !destinationMemberId) {
      return;
    }

    // Only the owner can remove
    // their destination.
    if (destinationMemberId !== memberId) {
      alert(
        "You can only remove your own destination."
      );

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/destination` +
          `?roomId=${encodeURIComponent(roomId)}` +
          `&memberId=${encodeURIComponent(
            destinationMemberId
          )}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to remove destination: ${response.status}`
        );
      }

      setSelectedDestination(null);

      if (selectedMemberId === destinationMemberId) {
        setSelectedMemberRoute(null);
        setLoadingMemberRoute(false);
      }

      console.log("Destination removed");
    } catch (error) {
      console.error(
        "Remove destination error:",
        error
      );

      alert("Could not remove destination.");
    }
  };

  // ====================================================
  // CANCEL DESTINATION
  // ====================================================

  const cancelDestination = () => {
    setSelectedDestination(null);
  };

  // ====================================================
  // SELECT MEMBER
  // ====================================================

  const selectMember = async (id) => {
    // Clicking same member closes
    // the selection.
    if (selectedMemberId === id) {
      setSelectedMemberId(null);
      setSelectedMemberRoute(null);
      setLoadingMemberRoute(false);

      return;
    }

    setSelectedMemberId(id);
    setSelectedMemberRoute(null);

    const member = members[id];

    if (!member) {
      return;
    }

    // --------------------------------------------------
    // MEMBER LOCATION
    // --------------------------------------------------

    if (!member.location) {
      return;
    }

    const startLat = Number(member.location.lat);
    const startLng = Number(member.location.lng);

    if (
      !Number.isFinite(startLat) ||
      !Number.isFinite(startLng)
    ) {
      return;
    }

    // --------------------------------------------------
    // DESTINATION
    // --------------------------------------------------

    if (!member.destination) {
      return;
    }

    const endLat = Number(member.destination.lat);
    const endLng = Number(member.destination.lng);

    if (
      !Number.isFinite(endLat) ||
      !Number.isFinite(endLng)
    ) {
      return;
    }

    // --------------------------------------------------
    // OSRM ROUTE
    // --------------------------------------------------

    setLoadingMemberRoute(true);

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${startLng},${startLat};` +
        `${endLng},${endLat}` +
        `?overview=full&geometries=geojson`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `OSRM HTTP error: ${response.status}`
        );
      }

      const data = await response.json();

      if (
        !data.routes ||
        data.routes.length === 0
      ) {
        throw new Error("No route found");
      }

      const route = data.routes[0];

      const coordinates =
        route.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

      setSelectedMemberRoute({
        memberId: id,
        coordinates,
        distance: route.distance,
        duration: route.duration,
      });
    } catch (error) {
      console.error(
        "Selected member route error:",
        error
      );

      setSelectedMemberRoute(null);
    } finally {
      setLoadingMemberRoute(false);
    }
  };

  // ====================================================
  // FORMAT DISTANCE
  // ====================================================

  const formatDistance = (meters) => {
    if (!Number.isFinite(meters)) {
      return "--";
    }

    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(2)} km`;
  };

  // ====================================================
  // FORMAT ETA
  // ====================================================

  const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds)) {
      return "--";
    }

    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  // ====================================================
  // MY LOCATION
  // ====================================================

  const goToMyLocation = () => {
    const me = members[memberId];

    if (!me?.location) {
      alert(
        "Your location is not available yet."
      );

      return;
    }

    const lat = Number(me.location.lat);
    const lng = Number(me.location.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      alert(
        "Your location is not available yet."
      );

      return;
    }

    window.dispatchEvent(
      new CustomEvent("victo-recenter", {
        detail: {
          lat,
          lng,
        },
      })
    );
  };

  // ====================================================
  // CURRENT SELECTED MEMBER
  // ====================================================

  const selectedMember = selectedMemberId
    ? members[selectedMemberId]
    : null;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="room-app">

      {/* ==================================================
          NEARBY MEMBER NOTIFICATION
      ================================================== */}

      {nearbyNotification && (
        <div
          className="victo-nearby-notification"
          role="status"
        >
          <div className="victo-nearby-notification-icon">
            🔔
          </div>

          <div>
            <div className="victo-nearby-notification-title">
              Member nearby
            </div>

            <div className="victo-nearby-notification-text">
              <b>
                {nearbyNotification.name}
              </b>{" "}
              is{" "}
              {nearbyNotification.distanceText}{" "}
              away.
            </div>
          </div>

          <button
            type="button"
            className="victo-nearby-notification-close"
            onClick={() =>
              setNearbyNotification(null)
            }
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* ==================================================
          TOP BAR
      ================================================== */}

      <div className="top-bar">
        <div className="room-info">

          <div className="room-brand">
            Victo
          </div>

          <div className="room-detail">
            Room:{" "}
            <b>{roomCode}</b>
          </div>

          <div className="room-detail">
            Members:{" "}
            <b>
              {Object.keys(members).length}
            </b>
          </div>

        </div>
      </div>

      {/* ==================================================
          MEMBERS PANEL
      ================================================== */}

      <div className="members-panel">

        <div className="members-title">
          MEMBERS
        </div>

        {Object.entries(members).map(
          ([id, member]) => {
            const isSelected =
              id === selectedMemberId;

            const hasDestination =
              Boolean(member.destination);

            return (
              <div
                className="member-row"
                key={id}
                onClick={() =>
                  selectMember(id)
                }
                style={{
                  cursor: "pointer",
                  borderRadius: "10px",
                  padding: "8px",
                  margin: "2px -8px",
                  background: isSelected
                    ? "rgba(99,102,241,0.14)"
                    : "transparent",
                  border: isSelected
                    ? "1px solid rgba(99,102,241,0.3)"
                    : "1px solid transparent",
                  transition: "0.2s ease",
                }}
              >
                <MemberAvatar
                  member={member}
                  size={34}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div className="member-name">
                    {member.name}

                    {id === memberId && (
                      <span
                        style={{
                          marginLeft: "6px",
                          fontSize: "10px",
                          color: "#6366f1",
                          fontWeight: 800,
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>

                  <div
                    className="member-status"
                    style={{
                      color: member.online
                        ? "#4ade80"
                        : "#6b7280",
                    }}
                  >
                    ●{" "}
                    {member.online
                      ? "Online"
                      : "Offline"}
                  </div>
                </div>

                {hasDestination && (
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.7,
                    }}
                    title="Destination set"
                  >
                    📍
                  </div>
                )}
              </div>
            );
          }
        )}

        {/* ==================================================
            SELECTED MEMBER DETAILS
        ================================================== */}

        {selectedMember && (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "1.2px",
                color: "#8d98ad",
                marginBottom: "8px",
              }}
            >
              SELECTED MEMBER
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                marginBottom: "10px",
              }}
            >
              <MemberAvatar
                member={selectedMember}
                size={38}
              />

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {selectedMember.name}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: selectedMember.online
                      ? "#4ade80"
                      : "#6b7280",
                    marginTop: "2px",
                  }}
                >
                  ●{" "}
                  {selectedMember.online
                    ? "Online"
                    : "Offline"}
                </div>
              </div>
            </div>

            {loadingMemberRoute && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#aab3c5",
                  padding: "8px 0",
                }}
              >
                Calculating route...
              </div>
            )}

            {!loadingMemberRoute &&
              !selectedMember.destination && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8d98ad",
                    lineHeight: 1.5,
                  }}
                >
                  📍 No destination set
                </div>
              )}

            {!loadingMemberRoute &&
              selectedMemberRoute && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "7px",
                  }}
                >
                  <div
                    style={{
                      padding: "9px",
                      background:
                        "rgba(255,255,255,0.05)",
                      border:
                        "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#8d98ad",
                        marginBottom: "3px",
                      }}
                    >
                      DISTANCE
                    </div>

                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    >
                      {formatDistance(
                        selectedMemberRoute.distance
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "9px",
                      background:
                        "rgba(255,255,255,0.05)",
                      border:
                        "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#8d98ad",
                        marginBottom: "3px",
                      }}
                    >
                      ETA
                    </div>

                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    >
                      {formatDuration(
                        selectedMemberRoute.duration
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* ==================================================
          BOTTOM SECTION
      ================================================== */}

      <BottomSection
        followMe={followMe}
        setFollowMe={setFollowMe}
        goToMyLocation={goToMyLocation}
        copyInviteLink={copyInviteLink}
        selectedDestination={selectedDestination}
        saveDestination={saveDestination}
        cancelDestination={cancelDestination}
      />

      {/* ==================================================
          TERRAIN BUTTON
      ================================================== */}

      <button
        className="terrain-button"
        onClick={() => {
          alert(
            "Terrain / Satellite mode will be added next."
          );
        }}
      >
        🗺 Terrain
      </button>

      {/* ==================================================
          MAP
      ================================================== */}

      <MapContainer
        center={[22.5726, 88.3639]}
        zoom={13}
        className="room-map"
      >

        {/* ----------------------------------------------
            MAP CONTROLLERS
        ---------------------------------------------- */}

        <RecenterMap
          members={members}
          memberId={memberId}
          followMe={followMe}
        />

        {/* ----------------------------------------------
            DARK MAP
        ---------------------------------------------- */}

        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {/* ----------------------------------------------
            MAP CLICK
        ---------------------------------------------- */}

        <MapClickHandler
          onSelect={(destination) => {
            setSelectedDestination(destination);
          }}
        />

        {/* ----------------------------------------------
            SELECTED MEMBER ROUTE
        ---------------------------------------------- */}

        {selectedMemberRoute && (
          <Polyline
            positions={
              selectedMemberRoute.coordinates
            }
            pathOptions={{
              color: "#6366f1",
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}

        {/* ----------------------------------------------
            MEMBER LOCATIONS
        ---------------------------------------------- */}

        {Object.entries(members).map(
          ([id, member]) => {
            if (!member.location) {
              return null;
            }

            const lat = Number(
              member.location.lat
            );

            const lng = Number(
              member.location.lng
            );

            if (
              !Number.isFinite(lat) ||
              !Number.isFinite(lng)
            ) {
              return null;
            }

            const isMe = id === memberId;

            const avatarHtml =
              member.profileImage
                ? `
                    <img
                      src="${member.profileImage}"
                      alt=""
                      style="
                        width:42px;
                        height:42px;
                        object-fit:cover;
                        border-radius:50%;
                        border:${
                          isMe
                            ? "3px solid #6366f1"
                            : "3px solid white"
                        };
                        box-shadow:
                          0 3px 12px
                          rgba(0,0,0,0.35);
                      "
                    />
                  `
                : `
                    <div
                      style="
                        width:42px;
                        height:42px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        border-radius:50%;
                        background:#202938;
                        border:${
                          isMe
                            ? "3px solid #6366f1"
                            : "3px solid white"
                        };
                        box-shadow:
                          0 3px 12px
                          rgba(0,0,0,0.35);
                        font-size:22px;
                      "
                    >
                      ${getInitialAvatar(member.name)}
                    </div>
                  `;

            return (
              <Marker
                key={`member-${id}`}
                position={[lat, lng]}
                icon={divIcon({
                  className:
                    "victo-member-marker",

                  html: `
                    <div
                      style="
                        width:42px;
                        height:42px;
                        position:relative;
                      "
                    >
                      ${avatarHtml}

                      <div
                        style="
                          position:absolute;
                          right:-1px;
                          bottom:-1px;
                          width:11px;
                          height:11px;
                          border-radius:50%;
                          background:${
                            member.online
                              ? "#22c55e"
                              : "#6b7280"
                          };
                          border:
                            2px solid white;
                          box-sizing:border-box;
                        "
                      ></div>
                    </div>
                  `,

                  iconSize: [42, 42],

                  iconAnchor: [21, 21],
                })}
              >
                <Popup>
                  <div
                    style={{
                      minWidth: "120px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <MemberAvatar
                        member={member}
                        size={30}
                      />

                      <div>
                        <b>
                          {member.name}
                          {isMe
                            ? " (You)"
                            : ""}
                        </b>

                        <div
                          style={{
                            fontSize: "11px",
                            color:
                              member.online
                                ? "#16a34a"
                                : "#6b7280",
                          }}
                        >
                          ●{" "}
                          {member.online
                            ? "Online"
                            : "Offline"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "12px",
                      }}
                    >
                      Live Location
                    </div>

                    {member.destination && (
                      <div
                        style={{
                          marginTop: "5px",
                          fontSize: "11px",
                          color: "#6366f1",
                        }}
                      >
                        📍 Destination set
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}

        {/* ----------------------------------------------
            SAVED DESTINATIONS
        ---------------------------------------------- */}

        {Object.entries(members).map(
          ([id, member]) => {
            if (!member.destination) {
              return null;
            }

            return (
              <DestinationMarker
                key={`destination-${id}`}
                id={id}
                member={member}
                memberId={memberId}
                onRemove={removeDestination}
              />
            );
          }
        )}

        {/* ----------------------------------------------
            TEMPORARY DESTINATION
        ---------------------------------------------- */}

        {selectedDestination && (
          <Marker
            position={[
              selectedDestination.lat,
              selectedDestination.lng,
            ]}
          >
            <Popup>
              <b>New Destination</b>

              <br />

              Click{" "}
              <b>"Set Destination"</b>{" "}
              to save it.
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// ======================================================
// EXPORT
// ======================================================

export default Room;