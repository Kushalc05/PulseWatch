package com.pulsewatch.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "threshold_configurations")
public class ThresholdConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "device_id", nullable = false, unique = true)
    private Device device;

    @Column(nullable = false)
    private Double temperatureThreshold;

    @Column(nullable = false)
    private Double humidityThreshold;

    @Column(nullable = false)
    private Double batteryThreshold;

    public ThresholdConfiguration() {
    }

    public ThresholdConfiguration(
            Device device,
            Double temperatureThreshold,
            Double humidityThreshold,
            Double batteryThreshold) {

        this.device = device;
        this.temperatureThreshold = temperatureThreshold;
        this.humidityThreshold = humidityThreshold;
        this.batteryThreshold = batteryThreshold;
    }

    public Long getId() {
        return id;
    }

    public Device getDevice() {
        return device;
    }

    public Double getTemperatureThreshold() {
        return temperatureThreshold;
    }

    public Double getHumidityThreshold() {
        return humidityThreshold;
    }

    public Double getBatteryThreshold() {
        return batteryThreshold;
    }

    public void setTemperatureThreshold(Double temperatureThreshold) {
        this.temperatureThreshold = temperatureThreshold;
    }

    public void setHumidityThreshold(Double humidityThreshold) {
        this.humidityThreshold = humidityThreshold;
    }

    public void setBatteryThreshold(Double batteryThreshold) {
        this.batteryThreshold = batteryThreshold;
    }
}