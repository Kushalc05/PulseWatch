document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       STATE
    ========================================= */

    const devices = new Map();
    const telemetryCache = new Map();

    let selectedDeviceId = null;
    let activeFilter = "ALL";
    let searchTerm = "";


    /* =========================================
       DOM REFERENCES
    ========================================= */

    const deviceList =
        document.getElementById("deviceList");

    const deviceSearch =
        document.getElementById("deviceSearch");

    const filterButtons =
        document.querySelectorAll(".filter-button");

    const fleetCount =
        document.getElementById("fleetCount");

    const directoryCount =
        document.getElementById("directoryCount");

    const connectionStatus =
        document.getElementById("connectionStatus");

    const statusIndicator =
        document.getElementById("statusIndicator");


    const selectionState =
        document.getElementById("selectionState");

    const deviceDetailContent =
        document.getElementById("deviceDetailContent");


    /* =========================================
       DEVICE DETAIL REFERENCES
    ========================================= */

    const detailDeviceName =
        document.getElementById("detailDeviceName");

    const detailDeviceMeta =
        document.getElementById("detailDeviceMeta");

    const detailStatus =
        document.getElementById("detailStatus");

    const detailStatusText =
        document.getElementById("detailStatusText");


    const detailTemperature =
        document.getElementById("detailTemperature");

    const detailHumidity =
        document.getElementById("detailHumidity");

    const detailBattery =
        document.getElementById("detailBattery");


    const infoDeviceId =
        document.getElementById("infoDeviceId");

    const infoLocation =
        document.getElementById("infoLocation");

    const infoCreatedAt =
        document.getElementById("infoCreatedAt");

    const infoLastTelemetry =
        document.getElementById("infoLastTelemetry");


    const telemetryHistory =
        document.getElementById("telemetryHistory");


    /* =========================================
       THRESHOLD REFERENCES
    ========================================= */

    const thresholdTemperature =
        document.getElementById("thresholdTemperature");

    const thresholdHumidity =
        document.getElementById("thresholdHumidity");

    const thresholdBattery =
        document.getElementById("thresholdBattery");

    const saveThresholdsButton =
        document.getElementById("saveThresholdsButton");

    const thresholdMessage =
        document.getElementById("thresholdMessage");


    /* =========================================
       INITIAL LOAD
    ========================================= */

    loadDevices();


    /* =========================================
       LOAD DEVICES
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

            .then(deviceListData => {

                devices.clear();

                deviceListData.forEach(device => {

                    devices.set(
                        device.id,
                        device
                    );
                });


                fleetCount.textContent =
                    deviceListData.length;

                directoryCount.textContent =
                    deviceListData.length;


                renderDeviceList();


                if (
                    deviceListData.length > 0 &&
                    selectedDeviceId === null
                ) {

                    selectDevice(
                        deviceListData[0].id
                    );
                }


                connectWebSocket();
            })

            .catch(error => {

                console.error(
                    "Failed to load devices:",
                    error
                );

                deviceList.innerHTML = `
                    <div class="error-state">
                        Unable to load devices.
                    </div>
                `;

                connectionStatus.textContent =
                    "API ERROR";

                statusIndicator.classList.remove(
                    "online"
                );

                statusIndicator.classList.add(
                    "offline"
                );
            });
    }


    /* =========================================
       RENDER DEVICE DIRECTORY
    ========================================= */

    function renderDeviceList() {

        const filteredDevices =
            Array.from(devices.values())
                .filter(matchesFilter)
                .filter(matchesSearch);


        directoryCount.textContent =
            filteredDevices.length;


        if (filteredDevices.length === 0) {

            deviceList.innerHTML = `
                <div class="directory-empty">
                    No devices match your search.
                </div>
            `;

            return;
        }


        deviceList.innerHTML = "";


        filteredDevices.forEach(device => {

            const item =
                document.createElement("button");

            item.type = "button";

            item.className =
                "device-list-item";


            if (
                device.id === selectedDeviceId
            ) {

                item.classList.add(
                    "selected"
                );
            }


            const latest =
                telemetryCache.get(device.id);


            const readingPreview =
                latest
                    ? `
                        <span>
                            ${Number(
                                latest.temperature
                            ).toFixed(1)}°C
                        </span>

                        <span>
                            ${Number(
                                latest.humidity
                            ).toFixed(1)}%
                        </span>

                        <span>
                            ${Number(
                                latest.battery
                            ).toFixed(1)}% BAT
                        </span>
                      `
                    : `
                        <span>
                            No telemetry
                        </span>
                      `;


            item.innerHTML = `

                <div class="list-item-top">

                    <span class="list-device-name">
                        ${escapeHtml(
                            device.deviceName
                        )}
                    </span>

                    <span class="list-status ${
                        device.status === "ONLINE"
                            ? "online"
                            : "offline"
                    }">

                        ${device.status}

                    </span>

                </div>


                <div class="list-item-meta">

                    ID-${String(
                        device.id
                    ).padStart(2, "0")}

                    ·

                    ${escapeHtml(
                        device.location
                    )}

                </div>


                <div class="list-item-reading">

                    ${readingPreview}

                </div>
            `;


            item.addEventListener(
                "click",
                () => {

                    selectDevice(
                        device.id
                    );
                }
            );


            deviceList.appendChild(item);
        });
    }


    /* =========================================
       FILTER
    ========================================= */

    function matchesFilter(device) {

        if (
            activeFilter === "ALL"
        ) {

            return true;
        }


        return (
            device.status ===
            activeFilter
        );
    }


    /* =========================================
       SEARCH
    ========================================= */

    function matchesSearch(device) {

        if (!searchTerm) {

            return true;
        }


        const searchableText = (

            `${device.deviceName} ` +
            `${device.location} ` +
            `${device.id}`

        ).toLowerCase();


        return searchableText.includes(
            searchTerm
        );
    }


    /* =========================================
       SEARCH EVENT
    ========================================= */

    deviceSearch.addEventListener(
        "input",
        event => {

            searchTerm =
                event.target.value
                    .trim()
                    .toLowerCase();

            renderDeviceList();
        }
    );


    /* =========================================
       FILTER EVENTS
    ========================================= */

    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    filterButton => {

                        filterButton.classList.remove(
                            "active"
                        );
                    }
                );


                button.classList.add(
                    "active"
                );


                activeFilter =
                    button.dataset.filter;


                renderDeviceList();
            }
        );
    });


    /* =========================================
       SELECT DEVICE
    ========================================= */

    function selectDevice(deviceId) {

        const device =
            devices.get(deviceId);


        if (!device) {

            return;
        }


        selectedDeviceId =
            deviceId;


        renderDeviceList();


        selectionState.hidden =
            true;

        deviceDetailContent.hidden =
            false;


        renderDeviceDetails(
            device
        );


        loadDeviceTelemetry(
            deviceId
        );


        loadThresholds(
            deviceId
        );
    }


    /* =========================================
       THRESHOLD CONFIGURATION
    ========================================= */

    function loadThresholds(deviceId) {

        clearThresholdMessage();

        setThresholdInputsDisabled(true);

        fetch(
            `/api/thresholds/device/${deviceId}`
        )

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Threshold API returned ${response.status}`
                    );
                }

                return response.json();
            })

            .then(configuration => {

                thresholdTemperature.value =
                    configuration.temperatureThreshold ?? "";

                thresholdHumidity.value =
                    configuration.humidityThreshold ?? "";

                thresholdBattery.value =
                    configuration.batteryThreshold ?? "";

                setThresholdInputsDisabled(false);
            })

            .catch(error => {

                console.error(
                    "Failed to load thresholds:",
                    error
                );

                clearThresholdInputs();

                showThresholdMessage(
                    "Unable to load monitoring thresholds.",
                    "error"
                );

                setThresholdInputsDisabled(true);
            });
    }


    function saveThresholds() {

        if (
            selectedDeviceId === null
        ) {

            return;
        }


        const temperature =
            Number(
                thresholdTemperature.value
            );

        const humidity =
            Number(
                thresholdHumidity.value
            );

        const battery =
            Number(
                thresholdBattery.value
            );


        if (
            !Number.isFinite(temperature) ||
            !Number.isFinite(humidity) ||
            !Number.isFinite(battery)
        ) {

            showThresholdMessage(
                "Enter valid values for all three thresholds.",
                "error"
            );

            return;
        }


        if (
            temperature < 0 ||
            humidity < 0 ||
            battery < 0
        ) {

            showThresholdMessage(
                "Threshold values cannot be negative.",
                "error"
            );

            return;
        }


        saveThresholdsButton.disabled =
            true;


        showThresholdMessage(
            "Saving changes...",
            "saving"
        );


        fetch(
            `/api/thresholds/device/${selectedDeviceId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    temperatureThreshold:
                        temperature,

                    humidityThreshold:
                        humidity,

                    batteryThreshold:
                        battery
                })
            }
        )

            .then(response => {

                if (!response.ok) {

                    return response.json()

                        .catch(
                            () => ({})
                        )

                        .then(errorBody => {

                            throw new Error(
                                errorBody.message ||
                                `Threshold API returned ${response.status}`
                            );
                        });
                }

                return response.json();
            })

            .then(configuration => {

                thresholdTemperature.value =
                    configuration.temperatureThreshold;

                thresholdHumidity.value =
                    configuration.humidityThreshold;

                thresholdBattery.value =
                    configuration.batteryThreshold;


                showThresholdMessage(
                    "Monitoring thresholds updated.",
                    "success"
                );
            })

            .catch(error => {

                console.error(
                    "Failed to save thresholds:",
                    error
                );

                showThresholdMessage(
                    error.message ||
                    "Unable to update monitoring thresholds.",
                    "error"
                );
            })

            .finally(() => {

                saveThresholdsButton.disabled =
                    false;
            });
    }


    function setThresholdInputsDisabled(
        disabled
    ) {

        thresholdTemperature.disabled =
            disabled;

        thresholdHumidity.disabled =
            disabled;

        thresholdBattery.disabled =
            disabled;

        saveThresholdsButton.disabled =
            disabled;
    }


    function clearThresholdInputs() {

        thresholdTemperature.value =
            "";

        thresholdHumidity.value =
            "";

        thresholdBattery.value =
            "";
    }


    function clearThresholdMessage() {

        thresholdMessage.textContent =
            "";

        thresholdMessage.className =
            "threshold-message";
    }


    function showThresholdMessage(
        message,
        type
    ) {

        thresholdMessage.textContent =
            message;

        thresholdMessage.className =
            `threshold-message ${type}`;
    }


    saveThresholdsButton.addEventListener(
        "click",
        saveThresholds
    );


    /* =========================================
       DEVICE DETAILS
    ========================================= */

    function renderDeviceDetails(device) {

        detailDeviceName.textContent =
            device.deviceName;


        detailDeviceMeta.textContent =
            `ID-${String(device.id).padStart(2, "0")} · ${device.location}`;


        updateDetailStatus(
            device.status
        );


        infoDeviceId.textContent =
            `ID-${String(device.id).padStart(2, "0")}`;


        infoLocation.textContent =
            device.location || "—";


        infoCreatedAt.textContent =
            formatExactTimestamp(
                device.createdAt
            );


        const latest =
            telemetryCache.get(
                device.id
            );


        if (latest) {

            updateSelectedDeviceTelemetry(
                latest
            );

        } else {

            detailTemperature.textContent =
                "—";

            detailHumidity.textContent =
                "—";

            detailBattery.textContent =
                "—";

            infoLastTelemetry.textContent =
                "Waiting for telemetry...";
        }
    }


    /* =========================================
       STATUS
    ========================================= */

    function updateDetailStatus(status) {

        detailStatus.classList.remove(
            "online",
            "offline"
        );


        if (
            status === "ONLINE"
        ) {

            detailStatus.classList.add(
                "online"
            );

        } else {

            detailStatus.classList.add(
                "offline"
            );
        }


        detailStatusText.textContent =
            status;
    }


    /* =========================================
       LOAD TELEMETRY HISTORY
    ========================================= */

    function loadDeviceTelemetry(deviceId) {

        telemetryHistory.innerHTML = `
            <div class="history-empty">
                Loading telemetry history...
            </div>
        `;


        fetch(
            `/api/telemetry/device/${deviceId}`
        )

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Telemetry API returned ${response.status}`
                    );
                }

                return response.json();
            })

            .then(history => {

                renderTelemetryHistory(
                    history
                );


                if (
                    history.length > 0 &&
                    !telemetryCache.has(deviceId)
                ) {

                    const latest =
                        history
                            .slice()
                            .sort(
                                (a, b) =>
                                    new Date(
                                        b.recordedAt
                                    ) -
                                    new Date(
                                        a.recordedAt
                                    )
                            )[0];


                    telemetryCache.set(
                        deviceId,
                        latest
                    );


                    if (
                        selectedDeviceId ===
                        deviceId
                    ) {

                        updateSelectedDeviceTelemetry(
                            latest
                        );
                    }


                    renderDeviceList();
                }
            })

            .catch(error => {

                console.error(
                    "Failed to load telemetry:",
                    error
                );


                telemetryHistory.innerHTML = `
                    <div class="history-empty">
                        Unable to load telemetry history.
                    </div>
                `;
            });
    }


    /* =========================================
       TELEMETRY HISTORY TABLE
    ========================================= */

    function renderTelemetryHistory(history) {

        if (
            !history ||
            history.length === 0
        ) {

            telemetryHistory.innerHTML = `
                <div class="history-empty">
                    No telemetry available for this device.
                </div>
            `;

            return;
        }


        const sortedHistory =
            history
                .slice()
                .sort(
                    (a, b) =>
                        new Date(
                            b.recordedAt
                        ) -
                        new Date(
                            a.recordedAt
                        )
                )
                .slice(0, 8);


        telemetryHistory.innerHTML =
            "";


        sortedHistory.forEach(
            telemetry => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "history-row";


                row.innerHTML = `

                    <span class="history-time">

                        ${formatExactTimestamp(
                            telemetry.recordedAt
                        )}

                    </span>


                    <span class="history-value">

                        ${Number(
                            telemetry.temperature
                        ).toFixed(1)}°C

                    </span>


                    <span class="history-value">

                        ${Number(
                            telemetry.humidity
                        ).toFixed(1)}%

                    </span>


                    <span class="history-value">

                        ${Number(
                            telemetry.battery
                        ).toFixed(1)}%

                    </span>

                `;


                telemetryHistory.appendChild(
                    row
                );
            }
        );
    }


    /* =========================================
       UPDATE SELECTED DEVICE TELEMETRY
    ========================================= */

    function updateSelectedDeviceTelemetry(
        telemetry
    ) {

        detailTemperature.textContent =
            `${Number(
                telemetry.temperature
            ).toFixed(1)} °C`;


        detailHumidity.textContent =
            `${Number(
                telemetry.humidity
            ).toFixed(1)} %`;


        detailBattery.textContent =
            `${Number(
                telemetry.battery
            ).toFixed(1)} %`;


        infoLastTelemetry.textContent =
            formatExactTimestamp(
                telemetry.recordedAt
            );
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


                statusIndicator.classList.remove(
                    "offline"
                );

                statusIndicator.classList.add(
                    "online"
                );


                stompClient.subscribe(
                    "/topic/telemetry",
                    message => {

                        const payload =
                            JSON.parse(
                                message.body
                            );


                        /*
                         * The telemetry topic can contain:
                         *
                         * 1. A telemetry object
                         * 2. A device object representing
                         *    an ONLINE/OFFLINE status change
                         */

                        if (
                            payload &&
                            payload.device &&
                            payload.temperature !== undefined
                        ) {

                            handleLiveTelemetry(
                                payload
                            );

                            return;
                        }


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
            },


            error => {

                console.error(
                    "WebSocket connection failed:",
                    error
                );


                connectionStatus.textContent =
                    "DISCONNECTED";


                statusIndicator.classList.remove(
                    "online"
                );

                statusIndicator.classList.add(
                    "offline"
                );
            }
        );
    }


    /* =========================================
       LIVE TELEMETRY HANDLER
    ========================================= */

    function handleLiveTelemetry(
        telemetry
    ) {

        if (
            !telemetry ||
            !telemetry.device
        ) {

            return;
        }


        const device =
            telemetry.device;


        const deviceId =
            device.id;


        telemetryCache.set(
            deviceId,
            telemetry
        );


        /*
         * Telemetry means the device is
         * actively communicating.
         */

        if (
            devices.has(deviceId)
        ) {

            const currentDevice =
                devices.get(
                    deviceId
                );


            currentDevice.status =
                "ONLINE";


            if (
                device.lastTelemetryAt !== undefined
            ) {

                currentDevice.lastTelemetryAt =
                    device.lastTelemetryAt;
            }


            devices.set(
                deviceId,
                currentDevice
            );
        }


        if (
            selectedDeviceId ===
            deviceId
        ) {

            updateSelectedDeviceTelemetry(
                telemetry
            );


            updateDetailStatus(
                "ONLINE"
            );
        }


        renderDeviceList();
    }


    /* =========================================
       LIVE DEVICE STATUS HANDLER
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


        if (
            devices.has(deviceId)
        ) {

            const currentDevice =
                devices.get(
                    deviceId
                );


            currentDevice.status =
                deviceUpdate.status;


            if (
                deviceUpdate.lastTelemetryAt !== undefined
            ) {

                currentDevice.lastTelemetryAt =
                    deviceUpdate.lastTelemetryAt;
            }


            devices.set(
                deviceId,
                currentDevice
            );

        } else {

            devices.set(
                deviceId,
                deviceUpdate
            );
        }


        /*
         * Update the selected device immediately.
         */

        if (
            selectedDeviceId ===
            deviceId
        ) {

            updateDetailStatus(
                deviceUpdate.status
            );
        }


        /*
         * Re-render the directory so the
         * ONLINE/OFFLINE badge changes immediately.
         */

        renderDeviceList();
    }


    /* =========================================
       EXACT TIMESTAMP
    ========================================= */

    function formatExactTimestamp(
        timestamp
    ) {

        if (!timestamp) {

            return "—";
        }


        const date =
            new Date(timestamp);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";
        }


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",

                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",

                hour12: true
            }
        );
    }


    /* =========================================
       HTML ESCAPING
    ========================================= */

    function escapeHtml(value) {

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