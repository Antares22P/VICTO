package com.victo.backend;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class VictoController {

    @GetMapping("/api/hello")
    public String hello() {
        return "Welcome to Victo!";
    }
}