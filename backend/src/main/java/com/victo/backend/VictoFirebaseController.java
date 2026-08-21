package com.victo.backend;

import com.google.firebase.database.FirebaseDatabase;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class VictoFirebaseController {

    @PostMapping("/firebase")
    public String testFirebase() throws Exception {

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Victo Firebase connected!");

        FirebaseDatabase.getInstance()
                .getReference("test")
                .setValueAsync(data)
                .get();

        return "Firebase connected!";
    }
}