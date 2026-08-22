import { useEffect, useState, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
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

  return <div style={avatarStyle}>{getInitialAvatar(member?.name)}</div>;
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

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ======================================================
// ROUTE COLORS
// ======================================================

const ROUTE_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#fb7185",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#c084fc",
];

function getRouteColor(memberId, members) {
  const ids = Object.keys(members);
  const index = ids.indexOf(memberId);

  if (index === -1) {
    return ROUTE_COLORS[0];
  }

  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

// ======================================================
// NEARBY SOUND
// ======================================================

function playNearbySound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

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

      oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.18);

      gain.gain.setValueAtTime(0.0001, now);

      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);

      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

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
    console.warn("Nearby notification sound could not play:", error);
  }
}

// ======================================================
// DESTINATION MARKER
// ======================================================

function DestinationMarker({ id, member, memberId, onRemove }) {
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

    const button = element.querySelector(".victo-destination-remove");

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

  const [selectedDestination, setSelectedDestination] = useState(null);

  const [followMe, setFollowMe] = useState(false);

  const [meshEnabled, setMeshEnabled] = useState(false);

  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [selectedMemberRoute, setSelectedMemberRoute] = useState(null);

  const [memberRoutes, setMemberRoutes] = useState([]);

  const [loadingMemberRoute, setLoadingMemberRoute] = useState(false);

  const [nearbyNotification, setNearbyNotification] = useState(null);

  const [membersPanelOpen, setMembersPanelOpen] = useState(true);

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

  const inviteLink = `${window.location.origin}/join/${roomCode}`;

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

  const leaveRoom = () => {
    const confirmed = window.confirm(
      "Are you sure you want to leave this room?",
    );

    if (!confirmed) {
      return;
    }

    // Clear this user's room session
    localStorage.removeItem("roomId");
    localStorage.removeItem("roomCode");
    localStorage.removeItem("memberId");
    localStorage.removeItem("name");

    // Return to home page
    window.location.href = "/";
  };

  // ====================================================
  // FIREBASE - LISTEN TO MEMBERS
  // ====================================================

  useEffect(() => {
    if (!roomId) {
      console.error("Room ID missing");
      return;
    }

    const membersRef = ref(database, `rooms/${roomId}/members`);

    const unsubscribe = onValue(
      membersRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        console.log("Firebase members:", data);

        setMembers(data);
      },
      (error) => {
        console.error("Firebase listener error:", error);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // ======================================================
  // CALCULATE ALL MEMBER → ALL DESTINATION ROUTES
  // ======================================================

  useEffect(() => {
    let cancelled = false;

    const calculateAllRoutes = async () => {
      // --------------------------------------------------
      // ALL MEMBERS WITH VALID LOCATIONS
      // --------------------------------------------------

      const validMembers = Object.entries(members).filter(([, member]) => {
        if (!member?.location) {
          return false;
        }

        const lat = Number(member.location.lat);
        const lng = Number(member.location.lng);

        return Number.isFinite(lat) && Number.isFinite(lng);
      });

      // --------------------------------------------------
      // ALL MEMBERS WHO HAVE DESTINATIONS
      // --------------------------------------------------

      const destinations = Object.entries(members).filter(([, member]) => {
        if (!member?.destination) {
          return false;
        }

        const lat = Number(member.destination.lat);
        const lng = Number(member.destination.lng);

        return Number.isFinite(lat) && Number.isFinite(lng);
      });

      // Nothing to calculate
      if (validMembers.length === 0 || destinations.length === 0) {
        setMemberRoutes([]);
        return;
      }

      // --------------------------------------------------
      // CREATE MEMBER → DESTINATION COMBINATIONS
      // --------------------------------------------------

      const routeRequests = [];

      validMembers.forEach(([memberId, member]) => {
        destinations.forEach(([destinationMemberId, destinationMember]) => {
          routeRequests.push({
            memberId,
            destinationMemberId,

            startLat: Number(member.location.lat),

            startLng: Number(member.location.lng),

            endLat: Number(destinationMember.destination.lat),

            endLng: Number(destinationMember.destination.lng),
          });
        });
      });

      // --------------------------------------------------
      // REQUEST ALL ROUTES
      // --------------------------------------------------

      const results = await Promise.all(
        routeRequests.map(async (request) => {
          try {
            const url =
              `https://router.project-osrm.org/route/v1/driving/` +
              `${request.startLng},${request.startLat};` +
              `${request.endLng},${request.endLat}` +
              `?overview=full&geometries=geojson`;

            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`OSRM HTTP error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
              return null;
            }

            const route = data.routes[0];

            const coordinates = route.geometry.coordinates.map(([lng, lat]) => [
              lat,
              lng,
            ]);

            return {
              memberId: request.memberId,

              destinationMemberId: request.destinationMemberId,

              coordinates,

              distance: route.distance,

              duration: route.duration,
            };
          } catch (error) {
            console.error(
              "Route calculation failed:",
              request.memberId,
              "→",
              request.destinationMemberId,
              error,
            );

            return null;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      // Remove failed routes
      const validRoutes = results.filter(Boolean);

      setMemberRoutes(validRoutes);
    };

    calculateAllRoutes();

    return () => {
      cancelled = true;
    };
  }, [members]);

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

    if (!Number.isFinite(myLat) || !Number.isFinite(myLng)) {
      return;
    }

    const currentlyNearby = new Set();

    Object.entries(members).forEach(([id, member]) => {
      if (id === memberId || !member?.location) {
        return;
      }

      const memberLat = Number(member.location.lat);
      const memberLng = Number(member.location.lng);

      if (!Number.isFinite(memberLat) || !Number.isFinite(memberLng)) {
        return;
      }

      const distance = getDistanceMeters(myLat, myLng, memberLat, memberLng);

      // ==================================================
      // MEMBER IS WITHIN 30 METERS
      // ==================================================

      if (distance <= 30) {
        currentlyNearby.add(id);

        // Only trigger when entering
        // the 30m radius.
        if (!nearbyMembersRef.current.has(id)) {
          const distanceText =
            distance < 1 ? "less than 1 m" : `${Math.round(distance)} m`;

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
              console.warn("Browser notification failed:", error);
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
          },
        );

        if (!response.ok) {
          console.error("Online status error:", response.status);
        }
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };

    updateOnlineStatus();

    const interval = setInterval(updateOnlineStatus, 10000);

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
      alert("Geolocation is not supported by your browser.");

      return;
    }

    const watchId = navigator.geolocation.watchPosition(
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
            },
          );

          if (!response.ok) {
            console.error("Location API error:", await response.text());

            return;
          }

          console.log("Location updated successfully");
        } catch (error) {
          console.error("Location update failed:", error);
        }
      },

      (error) => {
        console.error("GPS error:", error);
      },

      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      },
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
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save destination");
      }

      console.log("Destination saved");

      alert("Destination set successfully!");

      setSelectedDestination(null);
    } catch (error) {
      console.error("Destination error:", error);

      alert("Could not set destination");
    }
  };

  // ====================================================
  // REMOVE SAVED DESTINATION
  // ====================================================

  const removeDestination = async (destinationMemberId = memberId) => {
    if (!roomId || !destinationMemberId) {
      return;
    }

    // Only the owner can remove
    // their destination.
    if (destinationMemberId !== memberId) {
      alert("You can only remove your own destination.");

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/destination` +
          `?roomId=${encodeURIComponent(roomId)}` +
          `&memberId=${encodeURIComponent(destinationMemberId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to remove destination: ${response.status}`);
      }

      setSelectedDestination(null);

      if (selectedMemberId === destinationMemberId) {
        setSelectedMemberRoute(null);
        setLoadingMemberRoute(false);
      }

      console.log("Destination removed");
    } catch (error) {
      console.error("Remove destination error:", error);

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

    if (!Number.isFinite(startLat) || !Number.isFinite(startLng)) {
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

    if (!Number.isFinite(endLat) || !Number.isFinite(endLng)) {
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
        throw new Error(`OSRM HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = data.routes[0];

      const coordinates = route.geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);

      setSelectedMemberRoute({
        memberId: id,
        coordinates,
        distance: route.distance,
        duration: route.duration,
      });
    } catch (error) {
      console.error("Selected member route error:", error);

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
      alert("Your location is not available yet.");

      return;
    }

    const lat = Number(me.location.lat);
    const lng = Number(me.location.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert("Your location is not available yet.");

      return;
    }

    window.dispatchEvent(
      new CustomEvent("victo-recenter", {
        detail: {
          lat,
          lng,
        },
      }),
    );
  };

  // ====================================================
  // CURRENT SELECTED MEMBER
  // ====================================================

  const selectedMember = selectedMemberId ? members[selectedMemberId] : null;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="room-app">


        {/* ==================================================
    LEAVE ROOM
================================================== */}

<button
  type="button"
  className="leave-room-button"
  onClick={leaveRoom}
>
  ← Leave
</button>
      {/* ==================================================
          NEARBY MEMBER NOTIFICATION
      ================================================== */}

      {nearbyNotification && (
        <div className="victo-nearby-notification" role="status">
          <div className="victo-nearby-notification-icon">🔔</div>

          <div>
            <div className="victo-nearby-notification-title">Member nearby</div>

            <div className="victo-nearby-notification-text">
              <b>{nearbyNotification.name}</b> is{" "}
              {nearbyNotification.distanceText} away.
            </div>
          </div>

          <button
            type="button"
            className="victo-nearby-notification-close"
            onClick={() => setNearbyNotification(null)}
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
          <div className="room-brand">Victo</div>

          <div className="room-detail">
            Room: <b>{roomCode}</b>
          </div>

          <div className="room-detail">
            Members: <b>{Object.keys(members).length}</b>
          </div>
        </div>
      </div>

      {/* ==================================================
          MEMBERS PANEL
      ================================================== */}

      {/* ==================================================
    MEMBERS PANEL
================================================== */}

      {membersPanelOpen ? (
        <div className="members-panel premium-members-panel">
          {/* ----------------------------------------------
        HEADER
    ---------------------------------------------- */}

          <div className="members-panel-header">
            <div className="members-panel-title-group">
              <div className="members-panel-icon">👥</div>

              <div>
                <div className="members-panel-title">Members</div>

                <div className="members-panel-count">
                  {Object.keys(members).length}{" "}
                  {Object.keys(members).length === 1 ? "member" : "members"}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="members-panel-collapse"
              onClick={() => setMembersPanelOpen(false)}
              aria-label="Hide members"
              title="Hide members"
            >
              ˄
            </button>
          </div>

          {/* ----------------------------------------------
        MEMBER LIST
    ---------------------------------------------- */}

          <div className="members-list">
            {Object.entries(members).map(([id, member]) => {
              const isSelected = id === selectedMemberId;

              const hasDestination = Boolean(member.destination);

              return (
                <div
                  className={
                    isSelected
                      ? "member-row premium-member-row selected"
                      : "member-row premium-member-row"
                  }
                  key={id}
                  onClick={() => selectMember(id)}
                >
                  {/* PROFILE IMAGE */}

                  <div className="premium-member-avatar">
                    {member.profileImage ? (
                      <img
                        src={member.profileImage}
                        alt={member.name || "Member"}
                      />
                    ) : (
                      <span>{getInitialAvatar(member.name)}</span>
                    )}

                    {/* ONLINE DOT */}

                    <span
                      className={
                        member.online
                          ? "member-online-dot online"
                          : "member-online-dot offline"
                      }
                    />
                  </div>

                  {/* MEMBER INFO */}

                  <div className="premium-member-info">
                    <div className="premium-member-name">
                      <span>{member.name || "Member"}</span>

                      {id === memberId && (
                        <span className="premium-you-badge">YOU</span>
                      )}
                    </div>

                    <div
                      className={
                        member.online
                          ? "premium-member-status online-text"
                          : "premium-member-status"
                      }
                    >
                      {member.online ? "Online" : "Offline"}
                    </div>
                  </div>

                  {/* DESTINATION */}

                  {hasDestination && (
                    <div
                      className="member-destination-indicator"
                      title="Destination set"
                    >
                      <span>⌖</span>
                    </div>
                  )}

                  {/* SELECTED ARROW */}

                  {isSelected && <div className="member-selected-arrow">›</div>}
                </div>
              );
            })}
          </div>

          {/* ----------------------------------------------
        SELECTED MEMBER DETAILS
    ---------------------------------------------- */}

          {selectedMember && (
            <div className="selected-member-card">
              <div className="selected-member-card-header">
                <span>SELECTED MEMBER</span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMemberId(null);
                    setSelectedMemberRoute(null);
                    setLoadingMemberRoute(false);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="selected-member-main">
                <MemberAvatar member={selectedMember} size={46} />

                <div>
                  <div className="selected-member-name">
                    {selectedMember.name}
                  </div>

                  <div
                    className={
                      selectedMember.online
                        ? "selected-member-status online-text"
                        : "selected-member-status"
                    }
                  >
                    ● {selectedMember.online ? "Online" : "Offline"}
                  </div>
                </div>
              </div>

              {loadingMemberRoute && (
                <div className="selected-member-loading">
                  Calculating route...
                </div>
              )}

              {!loadingMemberRoute && !selectedMember.destination && (
                <div className="selected-member-empty">
                  ⌖ No destination set
                </div>
              )}

              {!loadingMemberRoute && selectedMemberRoute && (
                <div className="selected-route-stats">
                  <div className="selected-route-stat">
                    <span>DISTANCE</span>

                    <strong>
                      {formatDistance(selectedMemberRoute.distance)}
                    </strong>
                  </div>

                  <div className="selected-route-stat">
                    <span>ETA</span>

                    <strong>
                      {formatDuration(selectedMemberRoute.duration)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ==================================================
      COLLAPSED MEMBERS BUTTON
  ================================================== */

        <button
          type="button"
          className="members-panel-collapsed"
          onClick={() => setMembersPanelOpen(true)}
          aria-label="Show members"
        >
          <span className="collapsed-members-icon">👥</span>

          <span className="collapsed-members-count">
            {Object.keys(members).length}
          </span>
        </button>
      )}

      {/* ==================================================
          BOTTOM SECTION
      ================================================== */}

      <BottomSection
        followMe={followMe}
        setFollowMe={setFollowMe}
        meshEnabled={meshEnabled}
        setMeshEnabled={setMeshEnabled}
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
          alert("Terrain / Satellite mode will be added next.");
        }}
      >
        🗺 Terrain
      </button>

      {/* ==================================================
          MAP
      ================================================== */}

      <MapContainer center={[22.5726, 88.3639]} zoom={13} className="room-map">
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
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
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
    MESH
---------------------------------------------- */}

        {meshEnabled &&
          (() => {
            const validMembers = Object.entries(members).filter(
              ([id, member]) => {
                if (!member?.location) {
                  return false;
                }

                const lat = Number(member.location.lat);
                const lng = Number(member.location.lng);

                return Number.isFinite(lat) && Number.isFinite(lng);
              },
            );

            const meshLines = [];

            for (let i = 0; i < validMembers.length; i++) {
              for (let j = i + 1; j < validMembers.length; j++) {
                const [idA, memberA] = validMembers[i];
                const [idB, memberB] = validMembers[j];

                const latA = Number(memberA.location.lat);
                const lngA = Number(memberA.location.lng);

                const latB = Number(memberB.location.lat);
                const lngB = Number(memberB.location.lng);

                const distance = getDistanceMeters(latA, lngA, latB, lngB);

                const middleLat = (latA + latB) / 2;

                const middleLng = (lngA + lngB) / 2;

                meshLines.push(
                  <Polyline
                    key={`mesh-${idA}-${idB}`}
                    positions={[
                      [latA, lngA],
                      [latB, lngB],
                    ]}
                    pathOptions={{
                      color: "#67e8f9",
                      weight: 1,
                      opacity: 0.65,
                      dashArray: "2 6",
                    }}
                  >
                    <Tooltip
                      permanent
                      direction="center"
                      className="mesh-distance-label"
                    >
                      {formatDistance(distance)}
                    </Tooltip>
                  </Polyline>,
                );
              }
            }

            return meshLines;
          })()}

        {/* ----------------------------------------------
    ALL MEMBER → ALL DESTINATION ROUTES
---------------------------------------------- */}

        {memberRoutes.map((route, index) => {
          if (!route?.coordinates?.length) {
            return null;
          }

          const isSelected = route.memberId === selectedMemberId;

          const routeColor = getRouteColor(route.memberId, members);

          return (
            <Polyline
              key={
                `route-${route.memberId}-` +
                `${route.destinationMemberId}-${index}`
              }
              positions={route.coordinates}
              pathOptions={{
                color: routeColor,

                weight: isSelected ? 6 : 3,

                opacity: isSelected ? 0.95 : 0.55,

                lineCap: "round",

                lineJoin: "round",

                className: isSelected ? "victo-route-selected" : "victo-route",
              }}
            >
              <Tooltip sticky className="victo-route-tooltip">
                {members[route.memberId]?.name || "Member"} →{" "}
                {members[route.destinationMemberId]?.name || "Destination"}
                <br />
                {formatDistance(route.distance)}
                {" • "}
                {formatDuration(route.duration)}
              </Tooltip>
            </Polyline>
          );
        })}
        {/* ----------------------------------------------
            MEMBER LOCATIONS
        ---------------------------------------------- */}

        {Object.entries(members).map(([id, member]) => {
          if (!member.location) {
            return null;
          }

          const lat = Number(member.location.lat);

          const lng = Number(member.location.lng);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }

          const isMe = id === memberId;

          // const avatarHtml = member.profileImage
          const markerColor = isMe ? "#22d3ee" : getRouteColor(id, members);

          const avatarHtml = member.profileImage
            ? `
      <div
        class="victo-live-marker ${isMe ? "victo-live-marker-me" : ""}"
        style="--marker-color:${markerColor};"
      >

        ${
          isMe
            ? `
              <div class="victo-live-pulse"></div>
              <div class="victo-live-pulse pulse-delay"></div>
            `
            : ""
        }

        <div class="victo-live-avatar">
          <img
            src="${member.profileImage}"
            alt=""
          />
        </div>

        <div
          class="victo-live-status"
          style="
            background:${member.online ? "#22c55e" : "#6b7280"};
          "
        ></div>

      </div>
    `
            : `
      <div
        class="victo-live-marker ${isMe ? "victo-live-marker-me" : ""}"
        style="--marker-color:${markerColor};"
      >

        ${
          isMe
            ? `
              <div class="victo-live-pulse"></div>
              <div class="victo-live-pulse pulse-delay"></div>
            `
            : ""
        }

        <div
          class="victo-live-avatar victo-live-avatar-emoji"
        >
          ${getInitialAvatar(member.name)}
        </div>

        <div
          class="victo-live-status"
          style="
            background:${member.online ? "#22c55e" : "#6b7280"};
          "
        ></div>

      </div>
    `;

          return (
            <Marker
              key={`member-${id}`}
              position={[lat, lng]}
              icon={divIcon({
                className: "victo-member-marker",

                html: avatarHtml,

                iconSize: [58, 58],

                iconAnchor: [29, 29],
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
                    <MemberAvatar member={member} size={30} />

                    <div>
                      <b>
                        {member.name}
                        {isMe ? " (You)" : ""}
                      </b>

                      <div
                        style={{
                          fontSize: "11px",
                          color: member.online ? "#16a34a" : "#6b7280",
                        }}
                      >
                        ● {member.online ? "Online" : "Offline"}
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
        })}

        {/* ----------------------------------------------
            SAVED DESTINATIONS
        ---------------------------------------------- */}

        {Object.entries(members).map(([id, member]) => {
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
        })}

        {/* ----------------------------------------------
            TEMPORARY DESTINATION
        ---------------------------------------------- */}

        {selectedDestination && (
          <Marker position={[selectedDestination.lat, selectedDestination.lng]}>
            <Popup>
              <b>New Destination</b>
              <br />
              Click <b>"Set Destination"</b> to save it.
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
