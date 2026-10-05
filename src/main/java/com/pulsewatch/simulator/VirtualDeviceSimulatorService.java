package com.pulsewatch.simulator;

import com.pulsewatch.entity.Device;
import com.pulsewatch.repository.DeviceRepository;
import com.pulsewatch.service.TelemetryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class VirtualDeviceSimulatorService {

    private static final int DEVICE_COUNT = 5;

    private final DeviceRepository deviceRepository;
    private final TelemetryService telemetryService;
    private final Random random = new Random();

    private final Map<Long, DeviceState> deviceStates = new HashMap<>();

    @Value("${pulsewatch.simulator.enabled:false}")
    private boolean simulatorEnabled;

    public VirtualDeviceSimulatorService(
            DeviceRepository deviceRepository,
            TelemetryService telemetryService) {

        this.deviceRepository = deviceRepository;
        this.telemetryService = telemetryService;
    }

    @Scheduled(fixedRate = 30000)
    public void generateTelemetry() {

        if (!simulatorEnabled) {
            return;
        }

        List<Device> devices = deviceRepository.findAll();

        if (devices.isEmpty()) {
            createDemoDevices();
            devices = deviceRepository.findAll();
        }

        for (Device device : devices) {

            DeviceState state = deviceStates.computeIfAbsent(
                    device.getId(),
                    id -> createInitialState()
            );

            updateState(state);

            telemetryService.recordTelemetry(
                    device.getId(),
                    state.temperature,
                    state.humidity,
                    state.battery
            );
        }
    }

    private void createDemoDevices() {

        for (int i = 1; i <= DEVICE_COUNT; i++) {

            Device device = new Device(
                    String.format("Machine-%02d", i),
                    "Factory Floor " + (char) ('A' + i - 1),
                    com.pulsewatch.entity.DeviceStatus.OFFLINE
            );

            deviceRepository.save(device);
        }
    }

    private DeviceState createInitialState() {

        return new DeviceState(
                72 + random.nextDouble() * 8,
                50 + random.nextDouble() * 15,
                90 + random.nextDouble() * 10
        );
    }

    private void updateState(DeviceState state) {

        state.temperature += random.nextDouble() * 6 - 3;
        state.humidity += random.nextDouble() * 6 - 3;
        state.battery -= 0.2 + random.nextDouble() * 0.3;

        state.temperature = Math.max(
                60,
                Math.min(95, state.temperature)
        );

        state.humidity = Math.max(
                30,
                Math.min(90, state.humidity)
        );

        state.battery = Math.max(
                0,
                Math.min(100, state.battery)
        );
    }

    private static class DeviceState {

        double temperature;
        double humidity;
        double battery;

        DeviceState(
                double temperature,
                double humidity,
                double battery) {

            this.temperature = temperature;
            this.humidity = humidity;
            this.battery = battery;
        }
    }
}