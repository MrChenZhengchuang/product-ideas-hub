package com.productideas.security;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public String hashPassword(String password) {
        return hashPassword(password, randomSaltHex());
    }

    public String hashPassword(String password, String salt) {
        byte[] hash = SCrypt.generate(
            password.getBytes(StandardCharsets.UTF_8),
            salt.getBytes(StandardCharsets.UTF_8),
            16384,
            8,
            1,
            64
        );
        return "scrypt$" + salt + "$" + bytesToHex(hash);
    }

    public boolean verifyPassword(String password, String encryptedPassword) {
        if (encryptedPassword == null || encryptedPassword.isBlank()) {
            return false;
        }

        if (!encryptedPassword.startsWith("scrypt$")) {
            return password.equals(encryptedPassword);
        }

        String[] parts = encryptedPassword.split("\\$");
        if (parts.length < 3) {
            return false;
        }

        String salt = parts[1];
        String storedHash = parts[2];
        if (!storedHash.matches("(?i)[0-9a-f]+") || storedHash.length() % 2 != 0) {
            return false;
        }

        String calculatedHash = bytesToHex(
            SCrypt.generate(
                password.getBytes(StandardCharsets.UTF_8),
                salt.getBytes(StandardCharsets.UTF_8),
                16384,
                8,
                1,
                64
            )
        );

        byte[] storedBytes = hexToBytes(storedHash);
        byte[] calculatedBytes = hexToBytes(calculatedHash);
        if (storedBytes.length != calculatedBytes.length) {
            return false;
        }

        int diff = 0;
        for (int index = 0; index < storedBytes.length; index++) {
            diff |= storedBytes[index] ^ calculatedBytes[index];
        }
        return diff == 0;
    }

    private static String randomSaltHex() {
        byte[] bytes = new byte[8];
        SECURE_RANDOM.nextBytes(bytes);
        return bytesToHex(bytes);
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            builder.append(String.format("%02x", value));
        }
        return builder.toString();
    }

    private static byte[] hexToBytes(String hex) {
        int length = hex.length();
        byte[] bytes = new byte[length / 2];
        for (int index = 0; index < length; index += 2) {
            bytes[index / 2] = (byte) Integer.parseInt(hex.substring(index, index + 2), 16);
        }
        return bytes;
    }
}
