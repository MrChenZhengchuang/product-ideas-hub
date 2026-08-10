package com.productideas.util;

import java.util.Map;

public final class ProjectFallbackImages {

    private static final Map<String, String> IMAGES = Map.of(
        "ai", "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80",
        "ecommerce", "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
        "tool", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
        "content", "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80"
    );

    private static final String DEFAULT_IMAGE = IMAGES.get("tool");

    private ProjectFallbackImages() {
    }

    public static String resolve(String categoryKey) {
        if (categoryKey == null) {
            return DEFAULT_IMAGE;
        }
        return IMAGES.getOrDefault(categoryKey, DEFAULT_IMAGE);
    }
}
