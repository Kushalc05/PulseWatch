document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       STATE
    ========================================= */

    const devices = new Map();

    let telemetryData = [];

    let selectedDeviceId = null;

    let selectedTimeRange = "all";

    let temperatureChart = null;

    let humidityChart = null;

    let batteryChart = null;

    let stompClient = null;


    /* =========================================
       DOM REFERENCES
    ========================================= */

    const deviceSelect =
        document.getElementById("deviceSelect");

    const timeRange =
        document.getElementById("timeRange");

    const selectedDeviceLabel =
        document.getElementById("selectedDeviceLabel");

    const selectionState =
        document.getElementById("selectionState");

    const telemetryContent =
        document.getElementById("telemetryContent");


    const latestTemperature =
        document.getElementById("latestTemperature");

    const latestHumidity =
        document.getElementById("latestHumidity");

    const latestBattery =
        document.getElementById("latestBattery");

    const readingCount =
        document.getElementById("readingCount");


    const telemetryTableBody =
        document.getElementById("telemetryTableBody");

    const tableEmpty =
        document.getElementById("tableEmpty");

    const historyCount =
        document.getElementById("historyCount");


    const connectionStatus =
        document.getElementById("connectionStatus");

    const systemStatus =
        document.getElementById("systemStatus");


    /* =========================================
       INITIALIZATION
    ========================================= */

    loadDevices();

    connectWebSocket();


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

            .then(deviceList => {

                devices.clear();

                deviceSelect.innerHTML = `
                    <option value="">
                        Select a device
                    </option>
                `;


                deviceList.forEach(device => {

                    devices.set(
                        device.id,
                        device
                    );


                    const option =
                        document.createElement("option");


                    option.value =
                        device.id;


                    option.textContent =
                        `${device.deviceName} · ID-${String(device.id).padStart(2, "0")}`;


                    deviceSelect.appendChild(
                        option
                    );
                });


                /*
                 * Automatically select the first
                 * available device.
                 */

                if (deviceList.length > 0) {

                    deviceSelect.value =
                        deviceList[0].id;

                    selectedDeviceId =
                        deviceList[0].id;

                    selectedDeviceLabel.textContent =
                        deviceList[0].deviceName;

                    loadTelemetry(
                        deviceList[0].id
                    );
                }
            })

            .catch(error => {

                console.error(
                    "Failed to load devices:",
                    error
                );

                selectedDeviceLabel.textContent =
                    "Unable to load devices";
            });
    }


    /* =========================================
       DEVICE SELECTION
    ========================================= */

    deviceSelect.addEventListener(
        "change",
        () => {

            const deviceId =
                deviceSelect.value;


            if (!deviceId) {

                selectedDeviceId = null;

                selectedDeviceLabel.textContent =
                    "None";

                telemetryContent.hidden =
                    true;

                selectionState.hidden =
                    false;

                destroyCharts();

                return;
            }


            selectedDeviceId =
                Number(deviceId);


            const device =
                devices.get(
                    selectedDeviceId
                );


            selectedDeviceLabel.textContent =
                device
                    ? device.deviceName
                    : "Unknown device";


            loadTelemetry(
                selectedDeviceId
            );
        }
    );


    /* =========================================
       TIME RANGE
    ========================================= */

    timeRange.addEventListener(
        "change",
        () => {

            selectedTimeRange =
                timeRange.value;


            renderTelemetry();
        }
    );


    /* =========================================
       LOAD TELEMETRY
    ========================================= */

    function loadTelemetry(deviceId) {

        selectionState.hidden =
            true;

        telemetryContent.hidden =
            false;


        telemetryTableBody.innerHTML = "";

        tableEmpty.hidden =
            true;


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

            .then(data => {

                telemetryData =
                    Array.isArray(data)
                        ? data
                        : [];


                telemetryData.sort(
                    (a, b) =>
                        new Date(a.recordedAt) -
                        new Date(b.recordedAt)
                );


                renderTelemetry();
            })

            .catch(error => {

                console.error(
                    "Failed to load telemetry:",
                    error
                );


                telemetryData = [];

                renderTelemetry();
            });
    }


    /* =========================================
       RENDER TELEMETRY
    ========================================= */

    function renderTelemetry() {

        const filteredData =
            getFilteredTelemetry();


        readingCount.textContent =
            filteredData.length;


        historyCount.textContent =
            `${filteredData.length} ${
                filteredData.length === 1
                    ? "reading"
                    : "readings"
            }`;


        updateSummary(
            filteredData
        );


        renderTable(
            filteredData
        );


        renderCharts(
            filteredData
        );
    }


    /* =========================================
       FILTER TELEMETRY
    ========================================= */

    function getFilteredTelemetry() {

        if (
            selectedTimeRange === "all"
        ) {

            return telemetryData;
        }


        const limit =
            Number(
                selectedTimeRange
            );


        return telemetryData.slice(
            -limit
        );
    }


    /* =========================================
       SUMMARY
    ========================================= */

    function updateSummary(data) {

        if (data.length === 0) {

            latestTemperature.textContent =
                "—";

            latestHumidity.textContent =
                "—";

            latestBattery.textContent =
                "—";

            return;
        }


        const latest =
            data[data.length - 1];


        latestTemperature.textContent =
            `${latest.temperature.toFixed(1)} °C`;


        latestHumidity.textContent =
            `${latest.humidity.toFixed(1)} %`;


        latestBattery.textContent =
            `${latest.battery.toFixed(1)} %`;
    }


    /* =========================================
       TABLE
    ========================================= */

    function renderTable(data) {

        telemetryTableBody.innerHTML = "";


        if (data.length === 0) {

            tableEmpty.hidden =
                false;

            return;
        }


        tableEmpty.hidden =
            true;


        /*
         * Display newest reading first.
         */

        const rows =
            [...data].reverse();


        rows.forEach(reading => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${formatExactTimestamp(
                        reading.recordedAt
                    )}
                </td>

                <td class="telemetry-temperature">
                    ${reading.temperature.toFixed(2)} °C
                </td>

                <td class="telemetry-humidity">
                    ${reading.humidity.toFixed(2)} %
                </td>

                <td class="telemetry-battery">
                    ${reading.battery.toFixed(2)} %
                </td>

            `;


            telemetryTableBody.appendChild(
                row
            );
        });
    }


    /* =========================================
       CHARTS
    ========================================= */

    function renderCharts(data) {

        destroyCharts();


        if (data.length === 0) {

            return;
        }


        const labels =
            data.map(
                reading =>
                    formatChartTime(
                        reading.recordedAt
                    )
            );


        const temperatures =
            data.map(
                reading =>
                    reading.temperature
            );


        const humidities =
            data.map(
                reading =>
                    reading.humidity
            );


        const batteries =
            data.map(
                reading =>
                    reading.battery
            );


        temperatureChart =
            createChart(
                "temperatureChart",
                labels,
                temperatures,
                "Temperature"
            );


        humidityChart =
            createChart(
                "humidityChart",
                labels,
                humidities,
                "Humidity"
            );


        batteryChart =
            createChart(
                "batteryChart",
                labels,
                batteries,
                "Battery"
            );
    }


    function createChart(
        canvasId,
        labels,
        values,
        label
    ) {

        const canvas =
            document.getElementById(
                canvasId
            );


        if (!canvas) {

            return null;
        }


        const context =
            canvas.getContext("2d");


        return new Chart(
            context,
            {
                type: "line",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: label,

                            data: values,

                            borderColor:
                                "#55d9c5",

                            backgroundColor:
                                "rgba(85, 217, 197, 0.08)",

                            borderWidth: 2,

                            pointRadius:
                                values.length > 30
                                    ? 0
                                    : 3,

                            pointHoverRadius:
                                5,

                            tension:
                                0.35,

                            fill:
                                true
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            backgroundColor:
                                "#182324",

                            borderColor:
                                "rgba(205,220,218,0.18)",

                            borderWidth: 1,

                            titleColor:
                                "#f1f6f5",

                            bodyColor:
                                "#b2c1bf",

                            padding: 10
                        }
                    },

                    scales: {

                        x: {

                            grid: {
                                color:
                                    "rgba(205,220,218,0.07)"
                            },

                            ticks: {
                                color:
                                    "#899b98",

                                maxTicksLimit:
                                    8,

                                font: {
                                    size: 10
                                }
                            }
                        },

                        y: {

                            grid: {
                                color:
                                    "rgba(205,220,218,0.07)"
                            },

                            ticks: {
                                color:
                                    "#899b98",

                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            }
        );
    }


    /* =========================================
       DESTROY CHARTS
    ========================================= */

    function destroyCharts() {

        if (temperatureChart) {

            temperatureChart.destroy();

            temperatureChart = null;
        }


        if (humidityChart) {

            humidityChart.destroy();

            humidityChart = null;
        }


        if (batteryChart) {

            batteryChart.destroy();

            batteryChart = null;
        }
    }


    /* =========================================
       WEBSOCKET
    ========================================= */

    function connectWebSocket() {

        const socket =
            new SockJS("/ws");


        stompClient =
            Stomp.over(socket);


        stompClient.debug =
            null;


        stompClient.connect(

            {},

            () => {

                connectionStatus.textContent =
                    "SYSTEM ONLINE";


                systemStatus.classList.remove(
                    "offline"
                );


                stompClient.subscribe(
                    "/topic/telemetry",
                    message => {

                        const telemetry =
                            JSON.parse(
                                message.body
                            );


                        handleLiveTelemetry(
                            telemetry
                        );
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
            }
        );
    }


    /* =========================================
       LIVE TELEMETRY
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


        const deviceId =
            telemetry.device.id;


        /*
         * Only update the selected device.
         */

        if (
            Number(deviceId) !==
            Number(selectedDeviceId)
        ) {

            return;
        }


        /*
         * Avoid duplicating an existing
         * telemetry record if the same
         * record already exists.
         */

        const alreadyExists =
            telemetryData.some(
                reading =>
                    reading.id ===
                    telemetry.id
            );


        if (!alreadyExists) {

            telemetryData.push(
                telemetry
            );
        }


        telemetryData.sort(
            (a, b) =>
                new Date(a.recordedAt) -
                new Date(b.recordedAt)
        );


        /*
         * Keep the browser-side history
         * manageable.
         */

        if (
            telemetryData.length > 200
        ) {

            telemetryData =
                telemetryData.slice(-200);
        }


        renderTelemetry();
    }


    /* =========================================
       TIMESTAMP
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


    function formatChartTime(
        timestamp
    ) {

        const date =
            new Date(timestamp);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";
        }


        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",

                hour12: false
            }
        );
    }

});