package com.pulsewatch.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry")
public class Telemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(nullable = false)
    @Min(-50)
    @Max(150)
    private Double temperature;

    @Column(nullable = false)
    @Min(0)
    @Max(100)
    private Double humidity;

    @Column(nullable = false)
    @Min(0)
    @Max(100)
    private Double battery;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    public Telemetry() {
    }

    public Telemetry(
            Device device,
            Double temperature,
            Double humidity,
            Double battery
    ) {
        this.device = device;
        this.temperature = temperature;
        this.humidity = humidity;
        this.battery = battery;
        this.recordedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Device getDevice() {
        return device;
    }

    public Double getTemperature() {
        return temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public Double getBattery() {
        return battery;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }
}