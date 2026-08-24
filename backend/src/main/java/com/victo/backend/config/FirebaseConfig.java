package com.victo.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initializeFirebase() throws IOException {

        String credentialsPath = System.getenv(
                "FIREBASE_SERVICE_ACCOUNT_PATH"
        );

        InputStream serviceAccount;

        if (credentialsPath != null && !credentialsPath.isBlank()) {
            // Render
            serviceAccount = new FileInputStream(credentialsPath);
        } else {
            // Local development
            serviceAccount = new FileInputStream(
                    "firebase-service-account.json"
            );
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(
                        GoogleCredentials.fromStream(serviceAccount)
                )
                .setDatabaseUrl(
                        "https://victo-67c8e-default-rtdb.firebaseio.com"
                )
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }

        serviceAccount.close();
    }
}