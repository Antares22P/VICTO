package com.victo.backend.model;

public class Room {

    private String roomId;
    private String roomCode;
    private String roomName;
    private String creatorId;
    private long createdAt;

    public Room() {
    }

    public Room(String roomId, String roomCode, String roomName,
                String creatorId, long createdAt) {
        this.roomId = roomId;
        this.roomCode = roomCode;
        this.roomName = roomName;
        this.creatorId = creatorId;
        this.createdAt = createdAt;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(String creatorId) {
        this.creatorId = creatorId;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }
}