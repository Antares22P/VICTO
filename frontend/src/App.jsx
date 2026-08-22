import { useEffect, useState } from "react";
import Room from "./Room";
import "./App.css";
function App() {

  const API_URL = import.meta.env.VITE_API_URL;
  const [mode, setMode] = useState(null);

  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [inRoom, setInRoom] = useState(
    !!localStorage.getItem("roomId")
  );

  useEffect(() => {
  const path = window.location.pathname;

  if (path.startsWith("/join/")) {
    const code = path.split("/")[2];

    if (code) {
      setRoomCode(code.toUpperCase());
      setMode("join");
    }
  }
}, []);

  // ==========================================
  // CHECK INVITE LINK
  // ==========================================

  useEffect(() => {
    const path = window.location.pathname;

    if (path.startsWith("/join/")) {
      const code = path
        .split("/join/")[1]
        ?.toUpperCase();

      if (code) {
        setRoomCode(code);
        setMode("join");
      }
    }
  }, []);

  // ==========================================
  // CREATE ROOM
  // ==========================================

  const createRoom = async () => {
    if (!name || !roomName) {
      alert("Enter your name and room name");
      return;
    }

    try {
      const creatorId = crypto.randomUUID();

      const response = await fetch(
        `${API_URL}/api/rooms` +
          `?roomName=${encodeURIComponent(roomName)}` +
          `&creatorId=${encodeURIComponent(creatorId)}` +
          `&creatorName=${encodeURIComponent(name)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const room = await response.json();

      localStorage.setItem(
        "roomId",
        room.roomId
      );

      localStorage.setItem(
        "roomCode",
        room.roomCode
      );

      localStorage.setItem(
        "memberId",
        creatorId
      );

      localStorage.setItem(
        "name",
        name
      );

      setRoomCode(room.roomCode);

      setInRoom(true);

      alert(
        `Room created!\n\nRoom Code: ${room.roomCode}`
      );

    } catch (error) {

      console.error(error);

      alert(
        "Could not create room"
      );
    }
  };

  // ==========================================
  // JOIN ROOM
  // ==========================================

  const joinRoom = async () => {

    if (!name || !roomCode) {
      alert(
        "Enter your name and room code"
      );

      return;
    }

    try {

      const response = await fetch(

        `${API_URL}/api/rooms/join` +
          `?roomCode=${encodeURIComponent(
            roomCode
          )}` +
          `&name=${encodeURIComponent(name)}`,

        {
          method: "POST",
        }

      );


      if (!response.ok) {

        const errorText =
          await response.text();

        console.error(
          "Join error:",
          errorText
        );

        alert(
          "Room not found"
        );

        return;
      }


      const member =
        await response.json();


      // ====================================
      // IMPORTANT:
      // Backend should return roomId
      // ====================================

      localStorage.setItem(
        "memberId",
        member.memberId
      );

      localStorage.setItem(
        "name",
        member.name
      );

      localStorage.setItem(
        "roomCode",
        roomCode
      );


      if (member.roomId) {

        localStorage.setItem(
          "roomId",
          member.roomId
        );

      }


      setInRoom(true);

      alert(
        "Joined room!"
      );

      // Remove /join/CODE from URL

      window.history.replaceState(
        {},
        "",
        "/"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Could not join room"
      );

    }
  };


  // ==========================================
  // IF USER IS IN ROOM
  // ==========================================

  if (inRoom) {
    return <Room />;
  }


  // ==========================================
  // MAIN PAGE
  // ==========================================

  // ==========================================
// MAIN PAGE
// ==========================================

return (
  <div className="home-page">

    {/* BACKGROUND */}
    <div className="home-glow home-glow-one"></div>
    <div className="home-glow home-glow-two"></div>

    {/* HEADER */}
    <header className="home-header">
      <div className="home-logo">
        <div className="home-logo-mark">V</div>

        <div>
          <div className="home-brand">Victo</div>
          <div className="home-tagline">
            Live together. Stay connected.
          </div>
        </div>
      </div>

      <div className="home-status">
        <span className="home-status-dot"></span>
        Live location sharing
      </div>
    </header>


    {/* MAIN */}
    <main className="home-content">

      {!mode && (
        <section className="home-hero">

          <div className="hero-badge">
            <span>●</span>
            REAL-TIME LOCATION
          </div>

          <h1>
            Stay together,
            <br />
            <span>wherever you are.</span>
          </h1>

          <p className="hero-description">
            Create a private room and share your live location
            with the people who matter.
          </p>


          {/* ACTION CARDS */}
          <div className="home-actions">

            {/* CREATE */}
            <button
              className="home-action-card create-card"
              onClick={() => setMode("create")}
            >
              <div className="action-icon">
                +
              </div>

              <div className="action-content">
                <div className="action-title">
                  Create a room
                </div>

                <div className="action-description">
                  Start a new private location room
                </div>
              </div>

              <div className="action-arrow">
                →
              </div>
            </button>


            {/* JOIN */}
            <button
              className="home-action-card"
              onClick={() => setMode("join")}
            >
              <div className="action-icon join-icon">
                ↗
              </div>

              <div className="action-content">
                <div className="action-title">
                  Join a room
                </div>

                <div className="action-description">
                  Enter a room code to join your group
                </div>
              </div>

              <div className="action-arrow">
                →
              </div>
            </button>

          </div>

        </section>
      )}


      {/* ======================================
          CREATE ROOM
      ====================================== */}

      {mode === "create" && (
        <section className="room-form-card">

          <button
            className="back-button"
            onClick={() => setMode(null)}
          >
            ← Back
          </button>

          <div className="form-icon">
            +
          </div>

          <div className="form-heading">
            Create a room
          </div>

          <div className="form-subheading">
            Set up your private location space.
          </div>


          <div className="form-fields">

            <label>
              Your name
            </label>

            <input
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              autoComplete="name"
            />


            <label>
              Room name
            </label>

            <input
              placeholder="e.g. Weekend Trip"
              value={roomName}
              onChange={(e) =>
                setRoomName(e.target.value)
              }
            />


            <button
              className="primary-form-button"
              onClick={createRoom}
            >
              Create Room
              <span>→</span>
            </button>

          </div>

        </section>
      )}


      {/* ======================================
          JOIN ROOM
      ====================================== */}

      {mode === "join" && (
        <section className="room-form-card">

          <button
            className="back-button"
            onClick={() => setMode(null)}
          >
            ← Back
          </button>

          <div className="form-icon join-form-icon">
            ↗
          </div>

          <div className="form-heading">
            Join a room
          </div>

          <div className="form-subheading">
            Enter the details shared with you.
          </div>


          <div className="form-fields">

            <label>
              Your name
            </label>

            <input
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              autoComplete="name"
            />


            <label>
              Room code
            </label>

            <input
              className="room-code-input"
              placeholder="XXXXXX"
              value={roomCode}
              maxLength={10}
              onChange={(e) =>
                setRoomCode(
                  e.target.value.toUpperCase()
                )
              }
            />


            <button
              className="primary-form-button"
              onClick={joinRoom}
            >
              Join Room
              <span>→</span>
            </button>

          </div>

        </section>
      )}

    </main>


    {/* FOOTER */}
    <footer className="home-footer">
      <span>Private rooms</span>
      <span>•</span>
      <span>Real-time sharing</span>
      <span>•</span>
      <span>Built with Victo</span>
    </footer>

  </div>
);
}

export default App;