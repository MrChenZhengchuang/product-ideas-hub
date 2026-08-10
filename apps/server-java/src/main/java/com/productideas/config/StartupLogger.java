package com.productideas.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

@Component
public class StartupLogger implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(StartupLogger.class);

    @Value("${server.address}")
    private String host;

    @Value("${server.port}")
    private int port;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String baseUrl = "http://" + host + ":" + port;
        log.info("----------------------------------------");
        log.info("服务已就绪");
        log.info("根地址: {}", baseUrl);
        log.info("健康检查: {}/health", baseUrl);
        log.info("管理端 API: {}/api/admin", baseUrl);
        log.info("客户端 API: {}/api/client", baseUrl);
        log.info("----------------------------------------");
    }
}
