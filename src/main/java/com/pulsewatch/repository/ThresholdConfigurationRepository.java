package com.pulsewatch.repository;

import com.pulsewatch.entity.ThresholdConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ThresholdConfigurationRepository
        extends JpaRepository<ThresholdConfiguration, Long> {

    Optional<ThresholdConfiguration> findByDeviceId(Long deviceId);
}