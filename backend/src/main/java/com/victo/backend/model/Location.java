package com.victo.backend.model;

public class Location {

    private double lat;
    private double lng;
    private long updatedAt;

    public Location() {
    }

    public Location(double lat, double lng, long updatedAt) {
        this.lat = lat;
        this.lng = lng;
        this.updatedAt = updatedAt;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLng() {
        return lng;
    }

    public void setLng(double lng) {
        this.lng = lng;
    }

    public long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(long updatedAt) {
        this.updatedAt = updatedAt;
    }
}