package com.pulsewatch.controller;

import com.pulsewatch.dto.ThresholdConfigurationRequest;
import com.pulsewatch.entity.ThresholdConfiguration;
import com.pulsewatch.service.ThresholdConfigurationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/thresholds")
public class ThresholdConfigurationController {

    private final ThresholdConfigurationService thresholdService;

    public ThresholdConfigurationController(
            ThresholdConfigurationService thresholdService) {

        this.thresholdService = thresholdService;
    }

    @GetMapping("/device/{deviceId}")
    public ThresholdConfiguration getThresholds(
            @PathVariable Long deviceId) {

        return thresholdService.getOrCreateByDeviceId(deviceId);
    }

    @PutMapping("/device/{deviceId}")
    public ThresholdConfiguration updateThresholds(
            @PathVariable Long deviceId,
            @Valid @RequestBody ThresholdConfigurationRequest request) {

        return thresholdService.updateThresholds(
                deviceId,
                request
        );
    }
}