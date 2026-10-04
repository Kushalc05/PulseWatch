package com.pulsewatch.service;

import com.pulsewatch.entity.Device;
import com.pulsewatch.entity.DeviceStatus;
import com.pulsewatch.repository.DeviceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;

    public DeviceService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public Device registerDevice(String deviceName, String location) {

        Device device = new Device(
                deviceName,
                location,
                DeviceStatus.OFFLINE
        );

        return deviceRepository.save(device);
    }

    public List<Device> getAllDevices() {
        return deviceRepository.findAll();
    }
}