package com.pulsewatch.repository;

import com.pulsewatch.entity.Alert;
import com.pulsewatch.entity.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    Optional<Alert> findByDeviceIdAndAlertTypeAndStatus(
            Long deviceId,
            String alertType,
            AlertStatus status
    );

    List<Alert> findByStatus(AlertStatus status);

    List<Alert> findByStatusIn(
            List<AlertStatus> statuses
    );
}