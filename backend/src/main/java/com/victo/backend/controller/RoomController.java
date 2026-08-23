package com.victo.backend.controller;

import com.victo.backend.model.JoinResponse;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.victo.backend.model.Member;
import com.victo.backend.model.Room;
import org.springframework.web.bind.annotation.*;
import com.victo.backend.model.CreateRoomRequest;
import com.victo.backend.model.JoinRoomRequest;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/rooms")
// @CrossOrigin(origins = "http://localhost:5173")
public class RoomController {

        @PostMapping
        public Room createRoom(
                        @RequestBody CreateRoomRequest request) throws Exception {

                String roomId = UUID.randomUUID().toString();
                String roomCode = generateRoomCode();

                Room room = new Room(
                                roomId,
                                roomCode,
                                request.getRoomName(),
                                request.getCreatorId(),
                                System.currentTimeMillis());

                DatabaseReference database = FirebaseDatabase.getInstance().getReference();

                // Save room
                database.child("rooms")
                                .child(roomId)
                                .setValueAsync(room)
                                .get();

                // Save room code
                database.child("roomCodes")
                                .child(roomCode)
                                .setValueAsync(roomId)
                                .get();

                // Create creator as member
                Member creator = new Member(
                                request.getCreatorId(),
                                request.getCreatorName(),
                                System.currentTimeMillis(),
                                true,
                                request.getProfileImage());

                database.child("rooms")
                                .child(roomId)
                                .child("members")
                                .child(request.getCreatorId())
                                .setValueAsync(creator)
                                .get();

                return room;
        }

        @PostMapping("/join")
public JoinResponse joinRoom(
        @RequestBody JoinRoomRequest request) throws Exception {

    String roomCode = request.getRoomCode();
    String name = request.getName();
    String profileImage = request.getProfileImage();

    System.out.println("JOIN REQUEST");
    System.out.println("Room code: " + roomCode);
    System.out.println("Name: " + name);
    System.out.println("Profile image exists: " + (profileImage != null && !profileImage.isEmpty()));

    DatabaseReference database =
            FirebaseDatabase.getInstance().getReference();

    DatabaseReference roomCodeRef = database
            .child("roomCodes")
            .child(roomCode.toUpperCase());

    final String[] roomId = { null };
    final Exception[] error = { null };

    java.util.concurrent.CountDownLatch latch =
            new java.util.concurrent.CountDownLatch(1);

    roomCodeRef.addListenerForSingleValueEvent(
            new com.google.firebase.database.ValueEventListener() {

                @Override
                public void onDataChange(DataSnapshot snapshot) {

                    System.out.println(
                            "Firebase room lookup: "
                                    + snapshot.exists()
                    );

                    roomId[0] = snapshot.getValue(String.class);

                    latch.countDown();
                }

                @Override
                public void onCancelled(
                        com.google.firebase.database.DatabaseError firebaseError) {

                    error[0] = firebaseError.toException();

                    latch.countDown();
                }
            });

    latch.await();

    if (error[0] != null) {
        throw error[0];
    }

    if (roomId[0] == null) {
        throw new RuntimeException("Room not found");
    }

    String memberId = UUID.randomUUID().toString();

    Member member = new Member(
            memberId,
            name,
            System.currentTimeMillis(),
            true,
            profileImage
    );

    database
            .child("rooms")
            .child(roomId[0])
            .child("members")
            .child(memberId)
            .setValueAsync(member)
            .get();

    return new JoinResponse(
            roomId[0],
            memberId,
            name
    );
}

        private String generateRoomCode() {

                String characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

                StringBuilder code = new StringBuilder();

                for (int i = 0; i < 6; i++) {

                        int index = ThreadLocalRandom.current()
                                        .nextInt(characters.length());

                        code.append(characters.charAt(index));
                }

                return code.toString();
        }
}