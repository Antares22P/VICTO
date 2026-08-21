package com.victo.backend.controller;

import com.google.firebase.database.FirebaseDatabase;
import com.victo.backend.model.Location;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/location")
// @CrossOrigin(origins = "http://localhost:5173")
public class LocationController {

    @PostMapping
    public String updateLocation(
            @RequestParam String roomId,
            @RequestParam String memberId,
            @RequestBody Location location) throws Exception {

        FirebaseDatabase.getInstance()
                .getReference("rooms")
                .child(roomId)
                .child("members")
                .child(memberId)
                .child("location")
                .setValueAsync(location)
                .get();

        return "Location updated";
    }
}