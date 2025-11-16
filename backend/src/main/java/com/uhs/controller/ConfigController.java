package com.uhs.controller;

import com.uhs.dto.ConfigDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ConfigController {

    @Value("${app.currency:USD}")
    private String currency;

    @GetMapping
    public ResponseEntity<ConfigDto> getConfig() {
        ConfigDto config = new ConfigDto(currency);
        return ResponseEntity.ok(config);
    }
}

