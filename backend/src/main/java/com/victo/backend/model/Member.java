package com.victo.backend.model;

public class Member {

    private String memberId;
    private String name;
    private long joinedAt;
    private boolean online;
    private String roomId;

    public String getRoomId() {
    return roomId;
}

public void setRoomId(String roomId) {
    this.roomId = roomId;
}

    public Member() {
    }

    public Member(String memberId, String name, long joinedAt, boolean online) {
        this.memberId = memberId;
        this.name = name;
        this.joinedAt = joinedAt;
        this.online = online;
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

    public long getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(long joinedAt) {
        this.joinedAt = joinedAt;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }
}