package com.productideas.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class AccessLogFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger("access");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_BODY_LOG_LENGTH = 2048;
    private static final int MAX_CACHED_REQUEST_BODY_LENGTH = 64 * 1024;
    private static final Set<String> SENSITIVE_KEYS = Set.of(
        "password",
        "oldpassword",
        "newpassword",
        "confirmpassword",
        "captcha",
        "captchacode",
        "token",
        "accesstoken",
        "refreshtoken",
        "secret",
        "authorization"
    );

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        long startedAt = System.currentTimeMillis();
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(
            request,
            MAX_CACHED_REQUEST_BODY_LENGTH
        );

        try {
            filterChain.doFilter(wrappedRequest, response);
        } finally {
            long elapsedMs = System.currentTimeMillis() - startedAt;
            int status = response.getStatus();
            String params = formatRequestParams(wrappedRequest);

            log.info(
                "{} {} -> {} {} ({}ms) 参数: {}",
                wrappedRequest.getMethod(),
                wrappedRequest.getRequestURI(),
                status,
                describeStatus(status),
                elapsedMs,
                params
            );
        }
    }

    private static String formatRequestParams(ContentCachingRequestWrapper request) {
        Map<String, String> parts = new LinkedHashMap<>();

        String queryParams = formatParameterMap(request.getParameterMap());
        if (!queryParams.isBlank()) {
            parts.put("query", queryParams);
        }

        String body = formatRequestBody(request);
        if (!body.isBlank()) {
            parts.put("body", body);
        }

        if (parts.isEmpty()) {
            return "-";
        }

        return parts.entrySet().stream()
            .map(entry -> entry.getKey() + "=" + entry.getValue())
            .collect(Collectors.joining(" "));
    }

    private static String formatParameterMap(Map<String, String[]> parameterMap) {
        if (parameterMap == null || parameterMap.isEmpty()) {
            return "";
        }

        return parameterMap.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> entry.getKey() + "=" + maskValue(entry.getKey(), joinValues(entry.getValue())))
            .collect(Collectors.joining("&"));
    }

    private static String joinValues(String[] values) {
        if (values == null || values.length == 0) {
            return "";
        }
        if (values.length == 1) {
            return values[0];
        }
        return Arrays.toString(values);
    }

    private static String formatRequestBody(ContentCachingRequestWrapper request) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {
            return "";
        }

        String contentType = request.getContentType();
        if (contentType != null) {
            String lowerContentType = contentType.toLowerCase(Locale.ROOT);
            if (lowerContentType.startsWith(MediaType.MULTIPART_FORM_DATA_VALUE)) {
                return "[multipart]";
            }
            if (!lowerContentType.contains(MediaType.APPLICATION_JSON_VALUE)
                && !lowerContentType.contains(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                && !lowerContentType.contains("text/plain")) {
                return "[content-type=" + contentType + "]";
            }
        }

        byte[] content = request.getContentAsByteArray();
        if (content.length == 0) {
            return "";
        }

        Charset charset = resolveCharset(request.getCharacterEncoding());
        String rawBody = new String(content, charset).trim();
        if (rawBody.isEmpty()) {
            return "";
        }

        if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains(MediaType.APPLICATION_JSON_VALUE)) {
            return maskJsonBody(rawBody);
        }

        if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains(MediaType.APPLICATION_FORM_URLENCODED_VALUE)) {
            return maskFormBody(rawBody);
        }

        return truncate(maskPlainBody(rawBody));
    }

    private static String maskJsonBody(String rawBody) {
        try {
            JsonNode root = OBJECT_MAPPER.readTree(rawBody);
            maskSensitiveNode(root);
            return truncate(OBJECT_MAPPER.writeValueAsString(root));
        } catch (Exception ignored) {
            return truncate(maskPlainBody(rawBody));
        }
    }

    private static String maskFormBody(String rawBody) {
        String[] pairs = rawBody.split("&");
        return Arrays.stream(pairs)
            .map(pair -> {
                int index = pair.indexOf('=');
                if (index < 0) {
                    return pair;
                }
                String key = pair.substring(0, index);
                String value = pair.substring(index + 1);
                return key + "=" + maskValue(key, value);
            })
            .collect(Collectors.joining("&"));
    }

    private static void maskSensitiveNode(JsonNode node) {
        if (node == null) {
            return;
        }

        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            objectNode.fields().forEachRemaining(entry -> {
                if (isSensitiveKey(entry.getKey())) {
                    objectNode.put(entry.getKey(), "***");
                } else {
                    maskSensitiveNode(entry.getValue());
                }
            });
            return;
        }

        if (node.isArray()) {
            ArrayNode arrayNode = (ArrayNode) node;
            for (int i = 0; i < arrayNode.size(); i++) {
                maskSensitiveNode(arrayNode.get(i));
            }
        }
    }

    private static String maskPlainBody(String rawBody) {
        String masked = rawBody;
        for (String key : SENSITIVE_KEYS) {
            masked = masked.replaceAll(
                "(?i)(\"" + key + "\"\\s*:\\s*\")([^\"]*)(\")",
                "$1***$3"
            );
        }
        return masked;
    }

    private static boolean isSensitiveKey(String key) {
        return SENSITIVE_KEYS.contains(key.toLowerCase(Locale.ROOT).replace("_", ""));
    }

    private static String maskValue(String key, String value) {
        return isSensitiveKey(key) ? "***" : truncate(value);
    }

    private static String truncate(String value) {
        if (value == null) {
            return "";
        }
        if (value.length() <= MAX_BODY_LOG_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_BODY_LOG_LENGTH) + "...(truncated)";
    }

    private static Charset resolveCharset(String encoding) {
        if (encoding == null || encoding.isBlank()) {
            return StandardCharsets.UTF_8;
        }
        try {
            return Charset.forName(encoding);
        } catch (Exception ignored) {
            return StandardCharsets.UTF_8;
        }
    }

    private static String describeStatus(int status) {
        if (status >= 500) {
            return "服务器错误";
        }
        if (status == 403) {
            return "禁止访问";
        }
        if (status == 401) {
            return "未登录";
        }
        if (status == 404) {
            return "未找到";
        }
        if (status >= 400) {
            return "请求有误";
        }
        if (status >= 200 && status < 300) {
            return "成功";
        }
        return "";
    }
}
