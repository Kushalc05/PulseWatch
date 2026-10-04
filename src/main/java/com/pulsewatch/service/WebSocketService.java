package com.pulsewatch.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendTelemetryUpdate(Object telemetry) {

        messagingTemplate.convertAndSend(
                "/topic/telemetry",
                telemetry
        );
    }

    public void sendAlertUpdate(Object alert) {

        messagingTemplate.convertAndSend(
                "/topic/alerts",
                alert
        );
    }
}