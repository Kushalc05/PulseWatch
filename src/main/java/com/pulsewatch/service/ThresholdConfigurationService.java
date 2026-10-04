package com.pulsewatch.service;

import com.pulsewatch.dto.ThresholdConfigurationRequest;
import com.pulsewatch.entity.Device;
import com.pulsewatch.entity.ThresholdConfiguration;
import com.pulsewatch.exception.ResourceNotFoundException;
import com.pulsewatch.repository.DeviceRepository;
import com.pulsewatch.repository.ThresholdConfigurationRepository;
import org.springframework.stereotype.Service;

@Service
public class ThresholdConfigurationService {

    private static final double DEFAULT_TEMPERATURE_THRESHOLD = 80.0;
    private static final double DEFAULT_HUMIDITY_THRESHOLD = 80.0;
    private static final double DEFAULT_BATTERY_THRESHOLD = 20.0;

    private final ThresholdConfigurationRepository thresholdRepository;
    private final DeviceRepository deviceRepository;

    public ThresholdConfigurationService(
            ThresholdConfigurationRepository thresholdRepository,
            DeviceRepository deviceRepository) {

        this.thresholdRepository = thresholdRepository;
        this.deviceRepository = deviceRepository;
    }

    public ThresholdConfiguration getOrCreateByDeviceId(
            Long deviceId) {

        return thresholdRepository
                .findByDeviceId(deviceId)
                .orElseGet(() ->
                        createDefaultConfiguration(deviceId));
    }

    public ThresholdConfiguration updateThresholds(
            Long deviceId,
            ThresholdConfigurationRequest request) {

        ThresholdConfiguration configuration =
                getOrCreateByDeviceId(deviceId);

        configuration.setTemperatureThreshold(
                request.getTemperatureThreshold()
        );

        configuration.setHumidityThreshold(
                request.getHumidityThreshold()
        );

        configuration.setBatteryThreshold(
                request.getBatteryThreshold()
        );

        return thresholdRepository.save(configuration);
    }

    private ThresholdConfiguration createDefaultConfiguration(
            Long deviceId) {

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Device not found with id: "
                                        + deviceId));

        ThresholdConfiguration configuration =
                new ThresholdConfiguration(
                        device,
                        DEFAULT_TEMPERATURE_THRESHOLD,
                        DEFAULT_HUMIDITY_THRESHOLD,
                        DEFAULT_BATTERY_THRESHOLD
                );

        return thresholdRepository.save(configuration);
    }
}