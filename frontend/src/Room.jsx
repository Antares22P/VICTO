import { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";

import { ref, onValue } from "firebase/database";
import { database } from "./firebase";

import "leaflet/dist/leaflet.css";

const API_URL = import.meta.env.VITE_API_URL;

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

function RecenterMap({ members, memberId }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    const me = members[memberId];

    if (!me?.location) return;

    const lat = Number(me.location.lat);
    const lng = Number(me.location.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    // Center only the first time
    if (!hasCentered.current) {
      map.setView([lat, lng], 15);
      hasCentered.current = true;
    }
  }, [members, memberId, map]);

  return null;
}

function MyLocationButton({ members, memberId }) {
  const map = useMap();

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

    map.flyTo([lat, lng], 16, {
      duration: 1,
    });
  };

  return (
    <button
      onClick={goToMyLocation}
      style={{
        position: "absolute",
        zIndex: 1000,
        bottom: "30px",
        right: "20px",
        background: "white",
        border: "none",
        borderRadius: "8px",
        padding: "10px 14px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      📍 My Location
    </button>
  );
}
// ======================================================
// ROOM
// ======================================================

function Room() {
  const routeCache = useRef(new Map());
  const [members, setMembers] = useState({});
  const [selectedDestination, setSelectedDestination] = useState(null);

  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

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

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);

      alert("Invite link copied!");
    } catch (error) {
      console.error(error);

      alert("Could not copy invite link");
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);

      alert("Room code copied!");
    } catch (error) {
      console.error(error);

      alert("Could not copy room code");
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

  // ====================================================
  // ONLINE STATUS
  // ====================================================

  useEffect(() => {
    if (!roomId || !memberId) {
      return;
    }

    const updateOnlineStatus = async () => {
      try {
        await fetch(
          `${API_URL}/api/member/status` +
            `?roomId=${encodeURIComponent(roomId)}` +
            `&memberId=${encodeURIComponent(memberId)}` +
            `&online=true`,
          {
            method: "POST",
          },
        );
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };

    // Immediately mark online
    updateOnlineStatus();

    // Then every 10 seconds
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

            name: name + "'s Destination",

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

  const removeDestination = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/destination` +
          `?roomId=${encodeURIComponent(roomId)}` +
          `&memberId=${encodeURIComponent(memberId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove destination");
      }

      alert("Destination removed!");
    } catch (error) {
      console.error("Remove destination error:", error);
      alert("Could not remove destination");
    }
  };

  // ====================================================
  // LOAD OSRM ROUTES
  //
  // EVERY MEMBER
  //        ↓
  // EVERY DESTINATION
  // ====================================================

  // ====================================================
  // LOAD OSRM ROUTES
  //
  // EVERY MEMBER
  //        ↓
  // EVERY DESTINATION
  //
  // Uses cache to avoid requesting OSRM unnecessarily
  // ====================================================

  useEffect(() => {
    const membersWithLocation = Object.entries(members).filter(
      ([_, member]) =>
        member.location &&
        member.location.lat != null &&
        member.location.lng != null,
    );

    const destinations = Object.entries(members).filter(
      ([_, member]) =>
        member.destination &&
        member.destination.lat != null &&
        member.destination.lng != null,
    );

    if (membersWithLocation.length === 0 || destinations.length === 0) {
      setRoutes([]);
      return;
    }

    const loadRoutes = async () => {
      setLoadingRoutes(true);

      const newRoutes = [];

      for (const [currentMemberId, member] of membersWithLocation) {
        for (const [destinationMemberId, destinationOwner] of destinations) {
          const start = member.location;
          const end = destinationOwner.destination;

          // Round GPS coordinates to reduce unnecessary
          // OSRM requests caused by tiny GPS changes.
          const startLat = Number(start.lat).toFixed(4);
          const startLng = Number(start.lng).toFixed(4);

          const endLat = Number(end.lat).toFixed(4);
          const endLng = Number(end.lng).toFixed(4);

          const cacheKey =
            `${currentMemberId}-` +
            `${destinationMemberId}-` +
            `${startLat},${startLng}-` +
            `${endLat},${endLng}`;

          // ============================================
          // CHECK CACHE
          // ============================================

          if (routeCache.current.has(cacheKey)) {
            newRoutes.push(routeCache.current.get(cacheKey));

            continue;
          }

          try {
            const url =
              `https://router.project-osrm.org/route/v1/driving/` +
              `${start.lng},${start.lat};` +
              `${end.lng},${end.lat}` +
              `?overview=full&geometries=geojson`;

            const response = await fetch(url);

            if (!response.ok) {
              console.error("OSRM HTTP error:", response.status);

              continue;
            }

            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
              console.log("No route found");
              continue;
            }

            const route = data.routes[0];

            // OSRM = [lng, lat]
            // Leaflet = [lat, lng]

            const coordinates = route.geometry.coordinates.map(([lng, lat]) => [
              lat,
              lng,
            ]);

            const routeObject = {
              id: `${currentMemberId}-${destinationMemberId}`,

              memberId: currentMemberId,

              destinationMemberId: destinationMemberId,

              coordinates,

              distance: route.distance,

              duration: route.duration,
            };

            // ============================================
            // SAVE TO CACHE
            // ============================================

            routeCache.current.set(cacheKey, routeObject);

            newRoutes.push(routeObject);
          } catch (error) {
            console.error("OSRM error:", error);
          }
        }
      }

      setRoutes(newRoutes);

      setLoadingRoutes(false);
    };

    loadRoutes();
  }, [members]);

  // ====================================================
  // FORMAT DISTANCE
  // ====================================================

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return Math.round(meters) + " m";
    }

    return (meters / 1000).toFixed(2) + " km";
  };

  // ====================================================
  // FORMAT ETA
  // ====================================================

  const formatDuration = (seconds) => {
    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
      return minutes + " min";
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return hours + " hr";
    }

    return hours + " hr " + remainingMinutes + " min";
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* ==================================================
          ROOM PANEL
      ================================================== */}

      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          top: "20px",
          left: "20px",

          width: "280px",

          background: "white",

          padding: "15px 20px",

          borderRadius: "10px",

          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",

          maxHeight: "calc(100vh - 40px)",

          overflowY: "auto",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px 0",
          }}
        >
          Victo
        </h2>

        <div>
          Room: <b>{roomCode}</b>
        </div>

        <div>
          You: <b>{name}</b>
        </div>

        <div>
          Members: <b>{Object.keys(members).length}</b>
        </div>

        {/* ==============================================
    MEMBER LIST
================================================ */}

        <div
          style={{
            marginTop: "15px",
            borderTop: "1px solid #ddd",
            paddingTop: "10px",
          }}
        >
          <b>Members</b>

          <div
            style={{
              marginTop: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {Object.entries(members).map(([id, member]) => (
              <div
                key={id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "7px 8px",
                  background: "#f5f5f5",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                <span>
                  {member.name}

                  {id === memberId && <b> (You)</b>}
                </span>

                <span>
                  {member.lastSeen &&
                  Date.now() - Number(member.lastSeen) < 20000
                    ? "🟢"
                    : "🔴"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ==============================================
            SHARE BUTTONS
        ============================================== */}

        <div
          style={{
            marginTop: "12px",

            display: "flex",

            flexDirection: "column",

            gap: "7px",
          }}
        >
          <button
            onClick={copyInviteLink}
            style={{
              padding: "9px",
              cursor: "pointer",
            }}
          >
            🔗 Copy Invite Link
          </button>

          <button
            onClick={copyRoomCode}
            style={{
              padding: "9px",
              cursor: "pointer",
            }}
          >
            📋 Copy Room Code
          </button>
        </div>

        {/* ==============================================
            SET DESTINATION
        ============================================== */}

        {selectedDestination && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "7px",
            }}
          >
            <button
              onClick={saveDestination}
              style={{
                width: "100%",
                padding: "9px",
                cursor: "pointer",
              }}
            >
              📍 Set Destination
            </button>

            <button
              onClick={() => setSelectedDestination(null)}
              style={{
                width: "100%",
                padding: "9px",
                cursor: "pointer",
              }}
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {members[memberId]?.destination && (
          <button
            onClick={removeDestination}
            style={{
              marginTop: "8px",
              width: "100%",
              padding: "9px",
              cursor: "pointer",
            }}
          >
            🗑️ Remove My Destination
          </button>
        )}

        {/* ==============================================
            ROUTES
        ============================================== */}

        {routes.length > 0 && (
          <div
            style={{
              marginTop: "15px",

              borderTop: "1px solid #ddd",

              paddingTop: "10px",

              maxHeight: "300px",

              overflowY: "auto",
            }}
          >
            <b>Routes</b>

            {routes.map((route) => {
              const member = members[route.memberId];

              const destinationOwner = members[route.destinationMemberId];

              if (!member || !destinationOwner) {
                return null;
              }

              return (
                <div
                  key={route.id}
                  style={{
                    marginTop: "8px",

                    padding: "8px",

                    border: "1px solid #ddd",

                    borderRadius: "6px",

                    fontSize: "13px",
                  }}
                >
                  <b>{member.name}</b>
                  {" → "}
                  <b>
                    {destinationOwner.name}
                    's destination
                  </b>
                  <br />
                  📍 {formatDistance(route.distance)}
                  <br />
                  ⏱️ {formatDuration(route.duration)}
                </div>
              );
            })}
          </div>
        )}

        {/* ==============================================
            LOADING
        ============================================== */}

        {loadingRoutes && (
          <div
            style={{
              marginTop: "10px",

              fontSize: "13px",
            }}
          >
            Loading routes...
          </div>
        )}
      </div>

      {/* ==================================================
          MAP
      ================================================== */}

      <MapContainer
        center={[22.5726, 88.3639]}
        zoom={13}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <RecenterMap members={members} memberId={memberId} />

        {/* ================================================
            OPEN STREET MAP
        ================================================ */}

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ================================================
            MAP CLICK
        ================================================ */}

        <MapClickHandler
          onSelect={(destination) => {
            setSelectedDestination(destination);
          }}
        />

        {/* ================================================
            OSRM ROUTES
        ================================================ */}

        {routes.map((route) => (
          <Polyline key={route.id} positions={route.coordinates} />
        ))}

        {/* ================================================
            MEMBER LOCATIONS
        ================================================ */}

        {Object.entries(members).map(([id, member]) => {
          if (!member.location) {
            return null;
          }

          return (
            <Marker
              key={`member-${id}`}
              position={[
                Number(member.location.lat),
                Number(member.location.lng),
              ]}
            >
              <Popup>
                <b>
                  {member.name}
                  {id === memberId ? " (You)" : ""}
                </b>
                <br />
                <span>{member.online ? "🟢 Online" : "🔴 Offline"}</span>
                <br />
                Live Location
              </Popup>
            </Marker>
          );
        })}

        {/* ================================================
            SAVED DESTINATIONS
        ================================================ */}

        {Object.entries(members).map(([id, member]) => {
          if (!member.destination) {
            return null;
          }

          return (
            <Marker
              key={`destination-${id}`}
              position={[
                Number(member.destination.lat),
                Number(member.destination.lng),
              ]}
            >
              <Popup>
                <b>
                  {member.name}
                  's Destination
                </b>
                <br />
                Destination
              </Popup>
            </Marker>
          );
        })}

        {/* ================================================
            TEMPORARY DESTINATION
        ================================================ */}

        {selectedDestination && (
          <Marker position={[selectedDestination.lat, selectedDestination.lng]}>
            <Popup>
              <b>New Destination</b>
              <br />
              Click "Set Destination" to save it.
            </Popup>
          </Marker>
        )}

        <MyLocationButton members={members} memberId={memberId} />
      </MapContainer>
    </div>
  );
}

export default Room;
