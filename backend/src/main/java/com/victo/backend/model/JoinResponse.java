package com.victo.backend.model;

public class JoinResponse {

    private String roomId;
    private String memberId;
    private String name;

    public JoinResponse() {
    }

    public JoinResponse(String roomId, String memberId, String name) {
        this.roomId = roomId;
        this.memberId = memberId;
        this.name = name;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getMemberId() {
        return memberId;
    }

    public void setMemberId(String memberId) {
        this.memberId = memberId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}