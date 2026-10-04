package com.pulsewatch.service;

import com.pulsewatch.entity.Alert;
import com.pulsewatch.entity.AlertSeverity;
import com.pulsewatch.entity.AlertStatus;
import com.pulsewatch.entity.Device;
import com.pulsewatch.entity.ThresholdConfiguration;
import com.pulsewatch.exception.ResourceNotFoundException;
import com.pulsewatch.repository.AlertRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AlertService {

    private static final int REQUIRED_ABNORMAL_READINGS = 3;
    private static final int REQUIRED_NORMAL_READINGS = 2;

    private final AlertRepository alertRepository;
    private final ThresholdConfigurationService thresholdConfigurationService;
    private final WebSocketService webSocketService;

    private final Map<String, Integer> abnormalReadingCounts =
            new HashMap<>();

    private final Map<String, Integer> normalReadingCounts =
            new HashMap<>();

    public AlertService(
            AlertRepository alertRepository,
            ThresholdConfigurationService thresholdConfigurationService,
            WebSocketService webSocketService) {

        this.alertRepository = alertRepository;
        this.thresholdConfigurationService =
                thresholdConfigurationService;
        this.webSocketService = webSocketService;
    }

    public void checkTelemetry(
            Device device,
            Double temperature,
            Double humidity,
            Double battery) {

        ThresholdConfiguration configuration =
                thresholdConfigurationService
                        .getOrCreateByDeviceId(device.getId());

        checkTemperature(
                device,
                temperature,
                configuration.getTemperatureThreshold()
        );

        checkHumidity(
                device,
                humidity,
                configuration.getHumidityThreshold()
        );

        checkBattery(
                device,
                battery,
                configuration.getBatteryThreshold()
        );
    }

    private void checkTemperature(
            Device device,
            Double temperature,
            Double threshold) {

        String key = device.getId() + ":HIGH_TEMPERATURE";

        if (temperature > threshold) {

            recordAbnormalReading(
                    device,
                    "HIGH_TEMPERATURE",
                    AlertSeverity.HIGH,
                    "Temperature exceeded "
                            + threshold + "°C",
                    key
            );

        } else {

            recordNormalReading(
                    device,
                    "HIGH_TEMPERATURE",
                    key
            );
        }
    }

    private void checkHumidity(
            Device device,
            Double humidity,
            Double threshold) {

        String key = device.getId() + ":HIGH_HUMIDITY";

        if (humidity > threshold) {

            recordAbnormalReading(
                    device,
                    "HIGH_HUMIDITY",
                    AlertSeverity.MEDIUM,
                    "Humidity exceeded "
                            + threshold + "%",
                    key
            );

        } else {

            recordNormalReading(
                    device,
                    "HIGH_HUMIDITY",
                    key
            );
        }
    }

    private void checkBattery(
            Device device,
            Double battery,
            Double threshold) {

        String key = device.getId() + ":LOW_BATTERY";

        if (battery < threshold) {

            recordAbnormalReading(
                    device,
                    "LOW_BATTERY",
                    AlertSeverity.HIGH,
                    "Battery dropped below "
                            + threshold + "%",
                    key
            );

        } else {

            recordNormalReading(
                    device,
                    "LOW_BATTERY",
                    key
            );
        }
    }

    private void recordAbnormalReading(
            Device device,
            String alertType,
            AlertSeverity severity,
            String message,
            String key) {

        int count =
                abnormalReadingCounts.getOrDefault(key, 0) + 1;

        abnormalReadingCounts.put(key, count);

        normalReadingCounts.put(key, 0);

        if (count >= REQUIRED_ABNORMAL_READINGS) {

            createAlert(
                    device,
                    alertType,
                    severity,
                    message
            );
        }
    }

    private void recordNormalReading(
            Device device,
            String alertType,
            String key) {

        int count =
                normalReadingCounts.getOrDefault(key, 0) + 1;

        normalReadingCounts.put(key, count);

        abnormalReadingCounts.put(key, 0);

        if (count >= REQUIRED_NORMAL_READINGS) {

            resolveRecoveredAlert(
                    device,
                    alertType
            );
        }
    }

    private void createAlert(
            Device device,
            String alertType,
            AlertSeverity severity,
            String message) {

        boolean alertAlreadyOpen =
                alertRepository
                        .findByDeviceIdAndAlertTypeAndStatus(
                                device.getId(),
                                alertType,
                                AlertStatus.OPEN
                        )
                        .isPresent();

        boolean alertAlreadyAcknowledged =
                alertRepository
                        .findByDeviceIdAndAlertTypeAndStatus(
                                device.getId(),
                                alertType,
                                AlertStatus.ACKNOWLEDGED
                        )
                        .isPresent();

        if (alertAlreadyOpen || alertAlreadyAcknowledged) {
            return;
        }

        Alert alert = new Alert(
                device,
                alertType,
                severity,
                AlertStatus.OPEN,
                message
        );

        Alert savedAlert =
                alertRepository.save(alert);

        webSocketService.sendAlertUpdate(savedAlert);
    }

    private void resolveRecoveredAlert(
            Device device,
            String alertType) {

        Alert alert =
                alertRepository
                        .findByDeviceIdAndAlertTypeAndStatus(
                                device.getId(),
                                alertType,
                                AlertStatus.OPEN
                        )
                        .orElseGet(() ->
                                alertRepository
                                        .findByDeviceIdAndAlertTypeAndStatus(
                                                device.getId(),
                                                alertType,
                                                AlertStatus.ACKNOWLEDGED
                                        )
                                        .orElse(null)
                        );

        if (alert != null) {

            alert.setStatus(AlertStatus.RESOLVED);

            Alert resolvedAlert =
                    alertRepository.save(alert);

            webSocketService.sendAlertUpdate(
                    resolvedAlert
            );
        }
    }

    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public List<Alert> getActiveAlerts() {
    return alertRepository.findByStatusIn(
            List.of(
                    AlertStatus.OPEN,
                    AlertStatus.ACKNOWLEDGED
            )
    );
}

    public Alert acknowledgeAlert(Long alertId) {

        Alert alert =
                alertRepository.findById(alertId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Alert not found with id: "
                                                + alertId));

        if (alert.getStatus() != AlertStatus.OPEN) {

            throw new RuntimeException(
                    "Only OPEN alerts can be acknowledged"
            );
        }

        alert.setStatus(AlertStatus.ACKNOWLEDGED);

        Alert acknowledgedAlert =
                alertRepository.save(alert);

        webSocketService.sendAlertUpdate(
                acknowledgedAlert
        );

        return acknowledgedAlert;
    }

    public Alert resolveAlert(Long alertId) {

        Alert alert =
                alertRepository.findById(alertId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Alert not found with id: "
                                                + alertId));

        if (alert.getStatus() != AlertStatus.ACKNOWLEDGED) {

            throw new RuntimeException(
                    "Only ACKNOWLEDGED alerts can be resolved"
            );
        }

        alert.setStatus(AlertStatus.RESOLVED);

        Alert resolvedAlert =
                alertRepository.save(alert);

        webSocketService.sendAlertUpdate(
                resolvedAlert
        );

        return resolvedAlert;
    }
}