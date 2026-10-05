package com.pulsewatch.service;

import com.pulsewatch.entity.Device;
import com.pulsewatch.entity.DeviceStatus;
import com.pulsewatch.repository.DeviceRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeviceStatusMonitorService {

    private static final long OFFLINE_TIMEOUT_SECONDS = 90;

    private final DeviceRepository deviceRepository;
    private final WebSocketService webSocketService;

    public DeviceStatusMonitorService(
            DeviceRepository deviceRepository,
            WebSocketService webSocketService) {

        this.deviceRepository = deviceRepository;
        this.webSocketService = webSocketService;
    }

    @Scheduled(fixedRate = 5000)
    public void checkDeviceStatus() {

        List<Device> devices = deviceRepository.findAll();

        LocalDateTime now = LocalDateTime.now();

        for (Device device : devices) {

            LocalDateTime lastTelemetryAt =
                    device.getLastTelemetryAt();

            // Device has never sent telemetry.
            if (lastTelemetryAt == null) {
                continue;
            }

            long secondsSinceLastTelemetry =
                    Duration
                            .between(lastTelemetryAt, now)
                            .getSeconds();

            if (secondsSinceLastTelemetry
                    > OFFLINE_TIMEOUT_SECONDS) {

                if (device.getStatus()
                        != DeviceStatus.OFFLINE) {

                    device.setStatus(DeviceStatus.OFFLINE);

                    deviceRepository.save(device);

                    webSocketService.sendTelemetryUpdate(device);

                    System.out.println(
                            "Device " + device.getId()
                                    + " (" + device.getDeviceName()
                                    + ") is now OFFLINE."
                    );
                }

            } else {

                if (device.getStatus()
                        != DeviceStatus.ONLINE) {

                    device.setStatus(DeviceStatus.ONLINE);

                    deviceRepository.save(device);

                    webSocketService.sendTelemetryUpdate(device);

                    System.out.println(
                            "Device " + device.getId()
                                    + " (" + device.getDeviceName()
                                    + ") is now ONLINE."
                    );
                }
            }
        }
    }
}