package com.pulsewatch.controller;

import com.pulsewatch.dto.TelemetryRequest;
import com.pulsewatch.entity.Telemetry;
import com.pulsewatch.service.TelemetryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Telemetry recordTelemetry(
            @Valid @RequestBody TelemetryRequest request) {

        return telemetryService.recordTelemetry(
                request.getDeviceId(),
                request.getTemperature(),
                request.getHumidity(),
                request.getBattery()
        );
    }

    @GetMapping
    public List<Telemetry> getAllTelemetry() {
        return telemetryService.getAllTelemetry();
    }

    @GetMapping("/device/{deviceId}")
    public List<Telemetry> getTelemetryByDevice(
            @PathVariable Long deviceId) {

        return telemetryService.getTelemetryByDevice(deviceId);
    }
}