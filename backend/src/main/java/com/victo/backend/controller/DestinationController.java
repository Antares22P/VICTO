package com.victo.backend.controller;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.victo.backend.model.Destination;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/destination")
@CrossOrigin(origins = "http://localhost:5173")
public class DestinationController {

    @DeleteMapping
public String deleteDestination(
        @RequestParam String roomId,
        @RequestParam String memberId
) throws Exception {

    DatabaseReference destinationRef =
            FirebaseDatabase.getInstance()
                    .getReference("rooms")
                    .child(roomId)
                    .child("members")
                    .child(memberId)
                    .child("destination");

    destinationRef.removeValueAsync().get();

    return "Destination removed";
}

    @PostMapping
    public String setDestination(
            @RequestParam String roomId,
            @RequestParam String memberId,
            @RequestBody Destination destination) throws Exception {

        FirebaseDatabase.getInstance()
                .getReference("rooms")
                .child(roomId)
                .child("members")
                .child(memberId)
                .child("destination")
                .setValueAsync(destination)
                .get();

        return "Destination saved";
    }
}