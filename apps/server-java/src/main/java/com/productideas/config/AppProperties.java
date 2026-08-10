package com.productideas.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final Upload upload = new Upload();

    public Jwt getJwt() {
        return jwt;
    }

    public Cors getCors() {
        return cors;
    }

    public Upload getUpload() {
        return upload;
    }

    public static class Jwt {
        private String secret = "replace-with-a-secure-secret";
        private long expiresInSeconds = 43200;

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public long getExpiresInSeconds() {
            return expiresInSeconds;
        }

        public void setExpiresInSeconds(long expiresInSeconds) {
            this.expiresInSeconds = expiresInSeconds;
        }
    }

    public static class Cors {
        private String allowedOriginPattern = "^https?://(localhost|127\\.0\\.0\\.1):\\d+$";

        public String getAllowedOriginPattern() {
            return allowedOriginPattern;
        }

        public void setAllowedOriginPattern(String allowedOriginPattern) {
            this.allowedOriginPattern = allowedOriginPattern;
        }
    }

    public static class Upload {
        private String dir = "uploads";
        private long maxSizeBytes = 2 * 1024 * 1024;

        public String getDir() {
            return dir;
        }

        public void setDir(String dir) {
            this.dir = dir;
        }

        public long getMaxSizeBytes() {
            return maxSizeBytes;
        }

        public void setMaxSizeBytes(long maxSizeBytes) {
            this.maxSizeBytes = maxSizeBytes;
        }
    }
}
