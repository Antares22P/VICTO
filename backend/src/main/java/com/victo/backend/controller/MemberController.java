package com.victo.backend.controller;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/member")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://victo-stayconnected.vercel.app/"
})
public class MemberController {

    @PostMapping("/status")
    public String updateStatus(
            @RequestParam String roomId,
            @RequestParam String memberId,
            @RequestParam boolean online
    ) throws Exception {

        DatabaseReference memberRef =
                FirebaseDatabase.getInstance()
                        .getReference("rooms")
                        .child(roomId)
                        .child("members")
                        .child(memberId);

        memberRef.child("online")
                .setValueAsync(online)
                .get();

        memberRef.child("lastSeen")
                .setValueAsync(System.currentTimeMillis())
                .get();

        return "Status updated";
    }
}