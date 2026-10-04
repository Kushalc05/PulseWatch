package com.pulsewatch.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class TelemetryRequest {

    @NotNull
    private Long deviceId;

    @NotNull
    @Min(-50)
    @Max(150)
    private Double temperature;

    @NotNull
    @Min(0)
    @Max(100)
    private Double humidity;

    @NotNull
    @Min(0)
    @Max(100)
    private Double battery;

    public Long getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(Long deviceId) {
        this.deviceId = deviceId;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Double getBattery() {
        return battery;
    }

    public void setBattery(Double battery) {
        this.battery = battery;
    }
}