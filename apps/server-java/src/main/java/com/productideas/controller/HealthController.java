package com.productideas.controller;

import com.productideas.mapper.HealthMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final HealthMapper healthMapper;

    public HealthController(HealthMapper healthMapper) {
        this.healthMapper = healthMapper;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        healthMapper.ping();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("message", "ok");
        return body;
    }
}
