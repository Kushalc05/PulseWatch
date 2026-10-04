package com.pulsewatch.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class ThresholdConfigurationRequest {

    @NotNull
    @DecimalMin("-50.0")
    @DecimalMax("150.0")
    private Double temperatureThreshold;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private Double humidityThreshold;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private Double batteryThreshold;

    public Double getTemperatureThreshold() {
        return temperatureThreshold;
    }

    public void setTemperatureThreshold(
            Double temperatureThreshold) {
        this.temperatureThreshold = temperatureThreshold;
    }

    public Double getHumidityThreshold() {
        return humidityThreshold;
    }

    public void setHumidityThreshold(
            Double humidityThreshold) {
        this.humidityThreshold = humidityThreshold;
    }

    public Double getBatteryThreshold() {
        return batteryThreshold;
    }

    public void setBatteryThreshold(
            Double batteryThreshold) {
        this.batteryThreshold = batteryThreshold;
    }
}