package com.productideas.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.productideas.common.ApiException;
import com.productideas.config.AppProperties;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final AppProperties appProperties;

    public TokenService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String signToken(Map<String, Object> payload) {
        long now = System.currentTimeMillis() / 1000;
        Map<String, Object> body = new LinkedHashMap<>(payload);
        body.put("iat", now);
        body.put("exp", now + appProperties.getJwt().getExpiresInSeconds());

        String encodedHeader = base64Url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String encodedPayload = base64Url(writeJson(body));
        String signature = signHmac(encodedHeader + "." + encodedPayload);
        return encodedHeader + "." + encodedPayload + "." + signature;
    }

    public Map<String, Object> verifyToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new ApiException("登录已失效，请重新登录", 401);
        }

        String encodedHeader = parts[0];
        String encodedPayload = parts[1];
        String signature = parts[2];
        String expectedSignature = signHmac(encodedHeader + "." + encodedPayload);

        if (!expectedSignature.equals(signature)) {
            throw new ApiException("登录已失效，请重新登录", 401);
        }

        Map<String, Object> payload = readJson(decodeBase64Url(encodedPayload), new TypeReference<>() {});
        Object exp = payload.get("exp");
        long expSeconds = exp instanceof Number number ? number.longValue() : 0;
        if (expSeconds < System.currentTimeMillis() / 1000) {
            throw new ApiException("登录已失效，请重新登录", 401);
        }

        return payload;
    }

    private String signHmac(String content) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(appProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest)
                .replace("=", "")
                .replace("+", "-")
                .replace("/", "_");
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sign token", exception);
        }
    }

    private static String base64Url(String input) {
        return Base64.getEncoder().encodeToString(input.getBytes(StandardCharsets.UTF_8))
            .replace("=", "")
            .replace("+", "-")
            .replace("/", "_");
    }

    private static String decodeBase64Url(String input) {
        String normalized = input.replace("-", "+").replace("_", "/");
        int padding = (4 - (normalized.length() % 4)) % 4;
        normalized = normalized + "=".repeat(padding);
        return new String(Base64.getDecoder().decode(normalized), StandardCharsets.UTF_8);
    }

    private static String writeJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to serialize json", exception);
        }
    }

    private static <T> T readJson(String json, TypeReference<T> typeReference) {
        try {
            return OBJECT_MAPPER.readValue(json, typeReference);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to parse json", exception);
        }
    }
}
