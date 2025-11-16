package com.uhs.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ConfigController.class)
@TestPropertySource(properties = "app.currency=SEK")
class ConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getConfig_ShouldReturnCurrencyConfiguration() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("SEK"));
    }
}

