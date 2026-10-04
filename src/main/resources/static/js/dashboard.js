document.addEventListener("DOMContentLoaded", () => {

    const devices = {};
    const alerts = {};
    const latestTelemetry = {};


    const deviceGrid =
        document.getElementById("deviceGrid");

    const deviceCount =
        document.getElementById("deviceCount");

    const onlineCount =
        document.getElementById("onlineCount");

    const alertCount =
        document.getElementById("alertCount");

    const activityContainer =
        document.getElementById("activityContainer");

    const connectionStatus =
        document.getElementById("connectionStatus");

    const connectionMetric =
        document.getElementById("connectionMetric");

    const avgTemperature =
        document.getElementById("avgTemperature");

    const avgHumidity =
        document.getElementById("avgHumidity");

    const avgBattery =
        document.getElementById("avgBattery");


    /* =========================================
       INITIAL LOAD
    ========================================= */

    loadDevices();
    loadAlerts();


    /* =========================================
       DEVICES
    ========================================= */

    function loadDevices() {

        fetch("/api/devices")

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Device API returned ${response.status}`
                    );
                }

                return response.json();
            })

            .then(deviceList => {

                deviceCount.textContent =
                    deviceList.length;

                let online = 0;

                deviceGrid.innerHTML = "";

                deviceList.forEach(device => {

                    devices[device.id] = device;

                    if (device.status === "ONLINE") {
                        online++;
                    }

                    createDeviceCard(device);
                });

                onlineCount.textContent =
                    online;

                connectWebSocket();
            })

            .catch(error => {

                console.error(
                    "Failed to load devices:",
                    error
                );

                deviceGrid.innerHTML = `
                    <div class="empty-state">
                        Unable to load devices.
                    </div>
                `;
            });
    }


    function createDeviceCard(device) {

        const card =
            document.createElement("div");

        card.className =
            "device-card";

        card.id =
            `device-${device.id}`;

        card.innerHTML = `

            <div class="device-header">

                <span class="device-name">
                    ${escapeHtml(
                        device.deviceName
                    )}
                </span>

                <span class="${
                    device.status === "ONLINE"
                        ? "online"
                        : "offline"
                }">

                    ${device.status}

                </span>

            </div>

            <div class="device-location">

                ID-${String(
                    device.id
                ).padStart(2, "0")}

                ·

                ${escapeHtml(
                    device.location
                )}

            </div>

            <div class="readings">

                <div class="reading">

                    <span class="reading-label">
                        Temperature
                    </span>

                    <span
                        class="reading-value"
                        id="temperature-${device.id}">
                        --
                    </span>

                </div>

                <div class="reading">

                    <span class="reading-label">
                        Humidity
                    </span>

                    <span
                        class="reading-value"
                        id="humidity-${device.id}">
                        --
                    </span>

                </div>

                <div class="reading">

                    <span class="reading-label">
                        Battery
                    </span>

                    <span
                        class="reading-value"
                        id="battery-${device.id}">
                        --
                    </span>

                </div>

            </div>
        `;

        deviceGrid.appendChild(card);
    }


    /* =========================================
       ALERTS
    ========================================= */

    function loadAlerts() {

        fetch("/api/alerts")

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Alert API returned ${response.status}`
                    );
                }

                return response.json();
            })

            .then(alertList => {

                alertList.forEach(alert => {
                    alerts[alert.id] = alert;
                });

                updateAlertSummary();
                renderRecentActivity();
            })

            .catch(error => {

                console.error(
                    "Failed to load alerts:",
                    error
                );
            });
    }


    function updateAlertSummary() {

        const activeAlerts =
            Object.values(alerts)
                .filter(
                    alert =>
                        alert.status === "OPEN" ||
                        alert.status === "ACKNOWLEDGED"
                );

        alertCount.textContent =
            activeAlerts.length;
    }


    /* =========================================
       RECENT ACTIVITY
    ========================================= */

    function renderRecentActivity() {

        const recentAlerts =
            Object.values(alerts)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                )
                .slice(0, 5);


        if (recentAlerts.length === 0) {

            activityContainer.innerHTML = `
                <div class="empty-state">
                    No recent alert activity.
                </div>
            `;

            return;
        }


        activityContainer.innerHTML = "";


        recentAlerts.forEach(alert => {

            const item =
                document.createElement("div");

            item.className =
                "activity-item";


            const markerClass =
                alert.status === "RESOLVED"
                    ? "resolved"
                    : "alert";


            /*
             * OPEN:
             * Show Acknowledge button.
             *
             * ACKNOWLEDGED:
             * Show Resolve button.
             *
             * RESOLVED:
             * No action button.
             */

            let actionHtml = "";

            if (alert.status === "OPEN") {

                actionHtml = `
                    <button
                        class="alert-action-button"
                        data-alert-id="${alert.id}"
                        data-action="acknowledge">
                        Acknowledge
                    </button>
                `;

            } else if (alert.status === "ACKNOWLEDGED") {

                actionHtml = `
                    <button
                        class="alert-action-button"
                        data-alert-id="${alert.id}"
                        data-action="resolve">
                        Resolve
                    </button>
                `;
            }


            item.innerHTML = `

                <span
                    class="activity-marker ${markerClass}">
                </span>

                <div class="activity-content">

                    <strong>
                        ${escapeHtml(
                            alert.alertType
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            alert.device.deviceName
                        )}
                        ·
                        ${escapeHtml(
                            alert.status
                        )}
                    </span>

                </div>

                <div class="activity-action">

                    ${actionHtml}

                </div>

                <span class="activity-time">

                    ${formatExactTimestamp(
                        alert.createdAt
                    )}

                </span>

            `;


            const actionButton =
                item.querySelector(
                    ".alert-action-button"
                );


            if (actionButton) {

                const action =
                    actionButton.dataset.action;

                if (action === "acknowledge") {

                    actionButton.addEventListener(
                        "click",
                        () => acknowledgeAlert(alert.id)
                    );

                } else if (action === "resolve") {

                    actionButton.addEventListener(
                        "click",
                        () => resolveAlert(alert.id)
                    );
                }
            }


            activityContainer.appendChild(item);
        });
    }


    /* =========================================
       ACKNOWLEDGE ALERT
    ========================================= */

    function acknowledgeAlert(alertId) {

        const button =
            document.querySelector(
                `.alert-action-button[data-alert-id="${alertId}"]`
            );


        if (button) {

            button.disabled = true;

            button.textContent =
                "Acknowledging...";
        }


        fetch(
            `/api/alerts/${alertId}/acknowledge`,
            {
                method: "PUT"
            }
        )

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Acknowledge API returned ${response.status}`
                    );
                }

                return response.json();
            })

            .then(updatedAlert => {

                alerts[updatedAlert.id] =
                    updatedAlert;

                updateAlertSummary();
                renderRecentActivity();
            })

            .catch(error => {

                console.error(
                    "Failed to acknowledge alert:",
                    error
                );


                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "Acknowledge";
                }


                alert(
                    "Unable to acknowledge the alert. Please try again."
                );
            });
    }


    /* =========================================
       RESOLVE ALERT
    ========================================= */

    function resolveAlert(alertId) {

        const button =
            document.querySelector(
                `.alert-action-button[data-alert-id="${alertId}"]`
            );


        if (button) {

            button.disabled = true;

            button.textContent =
                "Resolving...";
        }


        fetch(
            `/api/alerts/${alertId}/resolve`,
            {
                method: "PUT"
            }
        )

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Resolve API returned ${response.status}`
                    );
                }

                return response.json();
            })

            .then(updatedAlert => {

                alerts[updatedAlert.id] =
                    updatedAlert;

                updateAlertSummary();
                renderRecentActivity();
            })

            .catch(error => {

                console.error(
                    "Failed to resolve alert:",
                    error
                );


                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "Resolve";
                }


                alert(
                    "Unable to resolve the alert. Please try again."
                );
            });
    }


    /* =========================================
       WEBSOCKET
    ========================================= */

    function connectWebSocket() {

        const socket =
            new SockJS("/ws");


        const stompClient =
            Stomp.over(socket);


        stompClient.debug =
            null;


        stompClient.connect(

            {},

            () => {

                connectionStatus.textContent =
                    "SYSTEM ONLINE";

                connectionMetric.textContent =
                    "LIVE";


                /*
                 * Telemetry topic contains:
                 *
                 * 1. Telemetry updates
                 * 2. Device status updates
                 */

                stompClient.subscribe(
                    "/topic/telemetry",
                    message => {

                        const payload =
                            JSON.parse(
                                message.body
                            );


                        /*
                         * TELEMETRY MESSAGE
                         */

                        if (
                            payload &&
                            payload.device &&
                            payload.temperature !== undefined
                        ) {

                            handleTelemetry(
                                payload
                            );

                            return;
                        }


                        /*
                         * DEVICE STATUS MESSAGE
                         */

                        if (
                            payload &&
                            payload.id !== undefined &&
                            payload.status !== undefined &&
                            payload.deviceName !== undefined
                        ) {

                            handleDeviceStatus(
                                payload
                            );
                        }
                    }
                );


                /*
                 * ALERT UPDATES
                 */

                stompClient.subscribe(
                    "/topic/alerts",
                    message => {

                        const alert =
                            JSON.parse(
                                message.body
                            );


                        alerts[alert.id] =
                            alert;


                        updateAlertSummary();

                        renderRecentActivity();
                    }
                );

            },

            error => {

                console.error(
                    "WebSocket connection failed:",
                    error
                );


                connectionStatus.textContent =
                    "DISCONNECTED";

                connectionMetric.textContent =
                    "OFFLINE";
            }
        );
    }


    /* =========================================
       TELEMETRY
    ========================================= */

    function handleTelemetry(
        telemetry
    ) {

        if (
            !telemetry ||
            !telemetry.device
        ) {

            return;
        }


        const deviceId =
            telemetry.device.id;


        /*
         * Telemetry means the device is
         * actively communicating.
         */

        if (
            devices[deviceId]
        ) {

            devices[deviceId].status =
                "ONLINE";
        }


        latestTelemetry[deviceId] = {

            temperature:
                telemetry.temperature,

            humidity:
                telemetry.humidity,

            battery:
                telemetry.battery
        };


        /*
         * Update the visible status badge.
         *
         * This is the important fix.
         */

        updateDeviceStatusBadge(
            deviceId,
            "ONLINE"
        );


        const temperature =
            document.getElementById(
                `temperature-${deviceId}`
            );

        const humidity =
            document.getElementById(
                `humidity-${deviceId}`
            );

        const battery =
            document.getElementById(
                `battery-${deviceId}`
            );


        if (!temperature) {

            return;
        }


        temperature.textContent =
            `${Number(
                telemetry.temperature
            ).toFixed(1)} °C`;


        humidity.textContent =
            `${Number(
                telemetry.humidity
            ).toFixed(1)} %`;


        battery.textContent =
            `${Number(
                telemetry.battery
            ).toFixed(1)} %`;


        updateTelemetrySnapshot();
    }


    /* =========================================
       LIVE DEVICE STATUS
    ========================================= */

    function handleDeviceStatus(
        deviceUpdate
    ) {

        if (
            !deviceUpdate ||
            deviceUpdate.id === undefined ||
            deviceUpdate.status === undefined
        ) {

            return;
        }


        const deviceId =
            deviceUpdate.id;


        /*
         * Update frontend state.
         */

        if (
            devices[deviceId]
        ) {

            devices[deviceId].status =
                deviceUpdate.status;


            if (
                deviceUpdate.lastTelemetryAt !== undefined
            ) {

                devices[deviceId].lastTelemetryAt =
                    deviceUpdate.lastTelemetryAt;
            }

        } else {

            devices[deviceId] =
                deviceUpdate;
        }


        /*
         * Update the visible badge.
         */

        updateDeviceStatusBadge(
            deviceId,
            deviceUpdate.status
        );


        /*
         * Recalculate online device count.
         */

        updateOnlineCount();
    }


    /* =========================================
       UPDATE DEVICE STATUS BADGE
    ========================================= */

    function updateDeviceStatusBadge(
        deviceId,
        status
    ) {

        const card =
            document.getElementById(
                `device-${deviceId}`
            );


        if (!card) {

            return;
        }


        const statusElement =
            card.querySelector(
                ".online, .offline"
            );


        if (!statusElement) {

            return;
        }


        statusElement.classList.remove(
            "online",
            "offline"
        );


        if (
            status === "ONLINE"
        ) {

            statusElement.classList.add(
                "online"
            );

        } else {

            statusElement.classList.add(
                "offline"
            );
        }


        statusElement.textContent =
            status;
    }


    /* =========================================
       UPDATE ONLINE COUNT
    ========================================= */

    function updateOnlineCount() {

        const onlineDevices =
            Object.values(devices)
                .filter(
                    device =>
                        device.status ===
                        "ONLINE"
                )
                .length;


        onlineCount.textContent =
            onlineDevices;
    }


    /* =========================================
       TELEMETRY SNAPSHOT
    ========================================= */

    function updateTelemetrySnapshot() {

        const readings =
            Object.values(
                latestTelemetry
            );


        if (
            readings.length === 0
        ) {

            return;
        }


        const temperature =
            readings.reduce(
                (sum, item) =>
                    sum + item.temperature,
                0
            ) / readings.length;


        const humidity =
            readings.reduce(
                (sum, item) =>
                    sum + item.humidity,
                0
            ) / readings.length;


        const battery =
            readings.reduce(
                (sum, item) =>
                    sum + item.battery,
                0
            ) / readings.length;


        avgTemperature.textContent =
            `${temperature.toFixed(1)} °C`;


        avgHumidity.textContent =
            `${humidity.toFixed(1)} %`;


        avgBattery.textContent =
            `${battery.toFixed(1)} %`;
    }


    /* =========================================
       UTILITIES
    ========================================= */

    function formatExactTimestamp(
        timestamp
    ) {

        const date =
            new Date(timestamp);


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",

                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );
    }


    function escapeHtml(
        value
    ) {

        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );
    }

});