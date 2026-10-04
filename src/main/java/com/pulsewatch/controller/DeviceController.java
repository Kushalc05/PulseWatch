package com.pulsewatch.controller;

import com.pulsewatch.entity.Device;
import com.pulsewatch.service.DeviceService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Device registerDevice(
            @RequestParam String deviceName,
            @RequestParam String location) {

        return deviceService.registerDevice(deviceName, location);
    }

    @GetMapping
    public List<Device> getAllDevices() {
        return deviceService.getAllDevices();
    }
}