package com.productideas.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.productideas.security.CaptchaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AdminLoginControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CaptchaService captchaService;

    @Test
    void optionsPreflightForLoginIsAllowed() throws Exception {
        mockMvc.perform(
                options("/api/admin/auth/login")
                    .header("Origin", "http://localhost:5174")
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "content-type")
            )
            .andExpect(status().isOk());
    }

    @Test
    void loginWithDemoAdminAccount() throws Exception {
        when(captchaService.verifyAndConsume(anyString(), anyString())).thenReturn(null);

        mockMvc.perform(
                post("/api/admin/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "account": "admin",
                          "password": "demo1234",
                          "captchaId": "test",
                          "captchaCode": "TEST"
                        }
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.token").isNotEmpty());
    }
}
