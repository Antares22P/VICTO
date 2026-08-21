import { useEffect, useState } from "react";
import Room from "./Room";

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

  return (

    <div
      style={{

        padding: "40px",

        maxWidth: "500px",

        margin: "auto",

      }}
    >

      <h1>
        Victo
      </h1>

      <p>
        Live location sharing
      </p>


      {/* ======================================
          HOME
      ====================================== */}

      {!mode && (

        <>

          <button
            onClick={() =>
              setMode("create")
            }
          >
            Create Room
          </button>


          <button
            onClick={() =>
              setMode("join")
            }

            style={{
              marginLeft: "10px",
            }}
          >
            Join Room
          </button>

        </>

      )}


      {/* ======================================
          CREATE
      ====================================== */}

      {mode === "create" && (

        <div>

          <h2>
            Create Room
          </h2>


          <input
            placeholder="Your name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />


          <br />
          <br />


          <input
            placeholder="Room name"
            value={roomName}
            onChange={(e) =>
              setRoomName(
                e.target.value
              )
            }
          />


          <br />
          <br />


          <button
            onClick={createRoom}
          >
            Create
          </button>

        </div>

      )}


      {/* ======================================
          JOIN
      ====================================== */}

      {mode === "join" && (

        <div>

          <h2>
            Join Room
          </h2>


          <input
            placeholder="Your name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />


          <br />
          <br />


          <input
            placeholder="Room code"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value.toUpperCase()
              )
            }
          />


          <br />
          <br />


          <button
            onClick={joinRoom}
          >
            Join
          </button>

        </div>

      )}

    </div>

  );
}

export default App;