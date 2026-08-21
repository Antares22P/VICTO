package com.victo.backend.model;

public class Destination {

    private double lat;
    private double lng;
    private String name;
    private long updatedAt;

    public Destination() {
    }

    public Destination(double lat, double lng, String name, long updatedAt) {
        this.lat = lat;
        this.lng = lng;
        this.name = name;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(long updatedAt) {
        this.updatedAt = updatedAt;
    }
}