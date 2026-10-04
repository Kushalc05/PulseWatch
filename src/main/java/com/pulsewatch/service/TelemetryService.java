package com.pulsewatch.service;

import com.pulsewatch.entity.Device;
import com.pulsewatch.entity.DeviceStatus;
import com.pulsewatch.entity.Telemetry;
import com.pulsewatch.repository.DeviceRepository;
import com.pulsewatch.repository.TelemetryRepository;
import com.pulsewatch.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;
    private final DeviceRepository deviceRepository;
    private final AlertService alertService;
    private final WebSocketService webSocketService;

    public TelemetryService(
            TelemetryRepository telemetryRepository,
            DeviceRepository deviceRepository,
            AlertService alertService,
            WebSocketService webSocketService) {

        this.telemetryRepository = telemetryRepository;
        this.deviceRepository = deviceRepository;
        this.alertService = alertService;
        this.webSocketService = webSocketService;
    }

    public Telemetry recordTelemetry(
            Long deviceId,
            Double temperature,
            Double humidity,
            Double battery) {

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Device not found with id: " + deviceId));

        /*
         * Telemetry has arrived from the device.
         * Therefore, the device is considered ONLINE
         * and its latest communication time is updated.
         */
        device.setStatus(DeviceStatus.ONLINE);
        device.setLastTelemetryAt(LocalDateTime.now());

        deviceRepository.save(device);

        Telemetry telemetry = new Telemetry(
                device,
                temperature,
                humidity,
                battery
        );

        Telemetry savedTelemetry =
                telemetryRepository.save(telemetry);

        webSocketService.sendTelemetryUpdate(savedTelemetry);

        alertService.checkTelemetry(
                device,
                temperature,
                humidity,
                battery
        );

        return savedTelemetry;
    }

    public List<Telemetry> getAllTelemetry() {
        return telemetryRepository.findAll();
    }

    public List<Telemetry> getTelemetryByDevice(Long deviceId) {
        return telemetryRepository.findByDeviceId(deviceId);
    }
}