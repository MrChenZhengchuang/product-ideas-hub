package com.productideas.security;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class CaptchaService {

    private static final String CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final long TTL_MILLIS = 5 * 60 * 1000;

    private final Map<String, CaptchaRecord> store = new ConcurrentHashMap<>();

    public CaptchaPayload createCaptcha() {
        String captchaId = UUID.randomUUID().toString();
        String text = randomText(4);
        store.put(captchaId, new CaptchaRecord(text, Instant.now().toEpochMilli() + TTL_MILLIS));
        return new CaptchaPayload(captchaId, createCaptchaSvg(text));
    }

    public String verifyAndConsume(String captchaId, String captchaCode) {
        CaptchaRecord record = store.get(captchaId);
        if (record == null || record.expiresAt() < Instant.now().toEpochMilli()) {
            return "验证码已过期，请刷新后重试";
        }

        String normalized = captchaCode == null ? "" : captchaCode.trim().toUpperCase();
        if (!record.text().equals(normalized)) {
            return "验证码错误";
        }

        store.remove(captchaId);
        return null;
    }

    private static String randomText(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int index = 0; index < length; index++) {
            int randomIndex = (int) (Math.random() * CHARS.length());
            builder.append(CHARS.charAt(randomIndex));
        }
        return builder.toString();
    }

    private static String createCaptchaSvg(String text) {
        StringBuilder chars = new StringBuilder();
        char[] letters = text.toCharArray();
        int[] rotates = {-18, -8, 7, 16};
        for (int index = 0; index < letters.length; index++) {
            int rotate = index < rotates.length ? rotates[index] : 0;
            int x = 22 + index * 24;
            int y = 34 + (index % 2 == 0 ? 0 : 4);
            chars.append(
                "<text x=\"" + x + "\" y=\"" + y + "\" font-size=\"24\" fill=\"#0f172a\" transform=\"rotate("
                    + rotate + " " + x + " " + y + ")\">" + letters[index] + "</text>"
            );
        }

        return """
            <svg xmlns="http://www.w3.org/2000/svg" width="132" height="44" viewBox="0 0 132 44">
              <rect width="132" height="44" rx="10" fill="#f8fafc" />
              <path d="M8 32 C24 10, 40 42, 58 18 S92 8, 124 26" stroke="#99f6e4" stroke-width="3" fill="none" />
              <path d="M14 10 C28 28, 48 4, 72 20 S108 42, 124 12" stroke="#fed7aa" stroke-width="3" fill="none" />
              <g font-family="Verdana, sans-serif" font-weight="700">%s</g>
            </svg>
            """.formatted(chars).trim();
    }

    public record CaptchaPayload(String captchaId, String svg) {
    }

    private record CaptchaRecord(String text, long expiresAt) {
    }
}
