package com.productideas.util;

import com.productideas.common.ApiException;
import com.productideas.common.PageQuery;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class RequestUtils {

    private RequestUtils() {
    }

    public static String requireBodyField(Map<String, Object> body, String... fields) {
        if (body == null) {
            return fields.length > 0 ? fields[0] : null;
        }

        for (String field : fields) {
            Object value = body.get(field);
            if (value == null) {
                return field;
            }
            if (value instanceof String text && text.trim().isEmpty()) {
                return field;
            }
        }

        return null;
    }

    public static String trimToEmpty(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    public static List<Long> normalizeNumberArray(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }

        Set<Long> normalized = new LinkedHashSet<>();
        for (Object item : list) {
            if (item instanceof Number number) {
                long longValue = number.longValue();
                if (longValue > 0) {
                    normalized.add(longValue);
                }
            } else if (item != null) {
                try {
                    long longValue = Long.parseLong(String.valueOf(item));
                    if (longValue > 0) {
                        normalized.add(longValue);
                    }
                } catch (NumberFormatException ignored) {
                    // skip invalid values
                }
            }
        }

        return new ArrayList<>(normalized);
    }

    public static PageQuery parsePage(Integer page, Integer pageSize) {
        return PageQuery.of(page, pageSize);
    }

    public static Long parsePositiveLong(String value, String errorMessage) {
        try {
            long parsed = Long.parseLong(value);
            if (parsed <= 0) {
                throw new ApiException(errorMessage, 400);
            }
            return parsed;
        } catch (NumberFormatException exception) {
            throw new ApiException(errorMessage, 400);
        }
    }
}
