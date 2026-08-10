package com.productideas.util;

import java.util.regex.Pattern;

public final class UserAgentUtils {

    private static final Pattern MOBILE_PATTERN = Pattern.compile("mobile|android|iphone|ipad", Pattern.CASE_INSENSITIVE);

    private UserAgentUtils() {
    }

    public static DeviceInfo parse(String userAgent) {
        String normalized = userAgent == null ? "" : userAgent;
        String deviceType = MOBILE_PATTERN.matcher(normalized).find() ? "mobile" : "desktop";

        String browser;
        if (normalized.toLowerCase().contains("edg/")) {
            browser = "Edge";
        } else if (normalized.toLowerCase().contains("chrome/")) {
            browser = "Chrome";
        } else if (normalized.toLowerCase().contains("safari/") && !normalized.toLowerCase().contains("chrome/")) {
            browser = "Safari";
        } else if (normalized.toLowerCase().contains("firefox/")) {
            browser = "Firefox";
        } else {
            browser = "未知浏览器";
        }

        String os;
        if (normalized.toLowerCase().contains("windows")) {
            os = "Windows";
        } else if (normalized.toLowerCase().contains("mac os x")) {
            os = "macOS";
        } else if (normalized.toLowerCase().contains("android")) {
            os = "Android";
        } else if (normalized.toLowerCase().contains("iphone")
            || normalized.toLowerCase().contains("ipad")
            || normalized.toLowerCase().contains("ios")) {
            os = "iOS";
        } else if (normalized.toLowerCase().contains("linux")) {
            os = "Linux";
        } else {
            os = "未知系统";
        }

        return new DeviceInfo(deviceType, browser, os, os + " · " + browser);
    }

    public record DeviceInfo(String deviceType, String browser, String os, String deviceName) {
    }
}
