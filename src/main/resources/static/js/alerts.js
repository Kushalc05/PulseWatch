document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       STATE
    ========================================= */

    const alerts = new Map();

    let selectedAlertId = null;

    let activeStatusFilter = "ALL";

    let searchTerm = "";


    /* =========================================
       DOM REFERENCES
    ========================================= */

    const alertList =
        document.getElementById("alertList");

    const alertSearch =
        document.getElementById("alertSearch");

    const filterButtons =
        document.querySelectorAll(".filter-button");

    const totalAlerts =
        document.getElementById("totalAlerts");

    const directoryCount =
        document.getElementById("directoryCount");

    const connectionStatus =
        document.getElementById("connectionStatus");

    const statusIndicator =
        document.getElementById("statusIndicator");


    /* =========================================
       DETAIL REFERENCES
    ========================================= */

    const selectionState =
        document.getElementById("selectionState");

    const alertDetailContent =
        document.getElementById("alertDetailContent");


    const detailAlertType =
        document.getElementById("detailAlertType");

    const detailDevice =
        document.getElementById("detailDevice");

    const detailSeverity =
        document.getElementById("detailSeverity");

    const detailStatus =
        document.getElementById("detailStatus");

    const detailMessage =
        document.getElementById("detailMessage");


    const infoAlertId =
        document.getElementById("infoAlertId");

    const infoDeviceName =
        document.getElementById("infoDeviceName");

    const infoLocation =
        document.getElementById("infoLocation");

    const infoSeverity =
        document.getElementById("infoSeverity");


    const timelineCreated =
        document.getElementById("timelineCreated");

    const timelineAcknowledged =
        document.getElementById(
            "timelineAcknowledged"
        );

    const timelineResolved =
        document.getElementById(
            "timelineResolved"
        );


    const createdTime =
        document.getElementById("createdTime");

    const acknowledgedTime =
        document.getElementById(
            "acknowledgedTime"
        );

    const resolvedTime =
        document.getElementById(
            "resolvedTime"
        );


    /* =========================================
       INITIAL LOAD
    ========================================= */

    loadAlerts();


    /* =========================================
       LOAD ALERTS
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

            .then(alertListData => {

                alerts.clear();

                alertListData.forEach(alert => {

                    alerts.set(
                        alert.id,
                        alert
                    );
                });


                totalAlerts.textContent =
                    alertListData.length;


                renderAlertList();


                /*
                 * Select the newest alert automatically
                 * when one exists.
                 */

                if (
                    alertListData.length > 0 &&
                    selectedAlertId === null
                ) {

                    const newestAlert =
                        [...alertListData]
                            .sort(
                                (a, b) =>
                                    new Date(
                                        b.createdAt
                                    ) -
                                    new Date(
                                        a.createdAt
                                    )
                            )[0];


                    selectAlert(
                        newestAlert.id
                    );
                }


                connectWebSocket();
            })

            .catch(error => {

                console.error(
                    "Failed to load alerts:",
                    error
                );


                alertList.innerHTML = `
                    <div class="error-state">
                        Unable to load alerts.
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
       RENDER ALERT LIST
    ========================================= */

    function renderAlertList() {

        const filteredAlerts =
            Array.from(alerts.values())

                .filter(matchesStatus)

                .filter(matchesSearch)

                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt
                        ) -
                        new Date(
                            a.createdAt
                        )
                );


        directoryCount.textContent =
            filteredAlerts.length;


        if (filteredAlerts.length === 0) {

            alertList.innerHTML = `
                <div class="directory-empty">
                    No alerts match your filters.
                </div>
            `;

            return;
        }


        alertList.innerHTML = "";


        filteredAlerts.forEach(alert => {

            const item =
                document.createElement("button");


            item.type = "button";


            item.className =
                "alert-list-item";


            if (
                alert.id === selectedAlertId
            ) {

                item.classList.add(
                    "selected"
                );
            }


            item.classList.add(
                alert.status.toLowerCase()
            );


            const severityClass =
                alert.severity.toLowerCase();


            item.innerHTML = `

                <div class="alert-item-top">

                    <span class="alert-item-type">

                        ${escapeHtml(
                            alert.alertType
                        )}

                    </span>


                    <span
                        class="alert-item-status ${
                            alert.status.toLowerCase()
                        }"
                    >

                        ${escapeHtml(
                            alert.status
                        )}

                    </span>

                </div>


                <div class="alert-item-device">

                    ${escapeHtml(
                        alert.device.deviceName
                    )}

                </div>


                <div class="alert-item-meta">

                    <span
                        class="alert-item-severity ${severityClass}"
                    >

                        ${escapeHtml(
                            alert.severity
                        )}

                    </span>


                    <span class="alert-item-time">

                        ${formatExactTimestamp(
                            alert.createdAt
                        )}

                    </span>

                </div>
            `;


            item.addEventListener(
                "click",
                () => {

                    selectAlert(
                        alert.id
                    );
                }
            );


            alertList.appendChild(item);
        });
    }


    /* =========================================
       FILTER LOGIC
    ========================================= */

    function matchesStatus(alert) {

        if (
            activeStatusFilter === "ALL"
        ) {

            return true;
        }


        return (
            alert.status ===
            activeStatusFilter
        );
    }


    function matchesSearch(alert) {

        if (!searchTerm) {

            return true;
        }


        const searchableText = (

            `${alert.alertType} ` +
            `${alert.message} ` +
            `${alert.severity} ` +
            `${alert.status} ` +
            `${alert.device.deviceName} ` +
            `${alert.device.location}`

        ).toLowerCase();


        return searchableText.includes(
            searchTerm
        );
    }


    /* =========================================
       SEARCH
    ========================================= */

    alertSearch.addEventListener(
        "input",
        event => {

            searchTerm =
                event.target.value
                    .trim()
                    .toLowerCase();


            renderAlertList();
        }
    );


    /* =========================================
       STATUS FILTERS
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


                activeStatusFilter =
                    button.dataset.status;


                renderAlertList();
            }
        );
    });


    /* =========================================
       SELECT ALERT
    ========================================= */

    function selectAlert(alertId) {

        const alert =
            alerts.get(alertId);


        if (!alert) {

            return;
        }


        selectedAlertId =
            alertId;


        renderAlertList();


        selectionState.hidden =
            true;

        alertDetailContent.hidden =
            false;


        renderAlertDetails(
            alert
        );
    }


    /* =========================================
       RENDER ALERT DETAILS
    ========================================= */

    function renderAlertDetails(alert) {

        const device =
            alert.device;


        detailAlertType.textContent =
            formatAlertType(
                alert.alertType
            );


        detailDevice.textContent =
            `${device.deviceName} · ${device.location}`;


        detailSeverity.textContent =
            alert.severity;


        detailSeverity.className =
            `detail-severity ${alert.severity.toLowerCase()}`;


        detailStatus.textContent =
            alert.status;


        detailStatus.className =
            `status-badge ${alert.status.toLowerCase()}`;


        detailMessage.textContent =
            alert.message;


        infoAlertId.textContent =
            `ALERT-${String(
                alert.id
            ).padStart(4, "0")}`;


        infoDeviceName.textContent =
            device.deviceName;


        infoLocation.textContent =
            device.location;


        infoSeverity.textContent =
            alert.severity;


        createdTime.textContent =
            formatExactTimestamp(
                alert.createdAt
            );


        updateLifecycle(
            alert
        );
    }


    /* =========================================
       LIFECYCLE
    ========================================= */

    function updateLifecycle(alert) {

        timelineCreated.classList.add(
            "completed"
        );


        timelineAcknowledged.classList.remove(
            "completed",
            "current"
        );


        timelineResolved.classList.remove(
            "completed",
            "current"
        );


        acknowledgedTime.textContent =
            "Awaiting acknowledgement";


        resolvedTime.textContent =
            "Awaiting resolution";


        if (
            alert.status === "OPEN"
        ) {

            timelineAcknowledged.classList.add(
                "current"
            );

            return;
        }


        if (
            alert.status ===
            "ACKNOWLEDGED"
        ) {

            timelineAcknowledged.classList.add(
                "completed"
            );


            acknowledgedTime.textContent =
                "Acknowledged";


            timelineResolved.classList.add(
                "current"
            );

            return;
        }


        if (
            alert.status ===
            "RESOLVED"
        ) {

            timelineAcknowledged.classList.add(
                "completed"
            );


            acknowledgedTime.textContent =
                "Acknowledged";


            timelineResolved.classList.add(
                "completed"
            );


            resolvedTime.textContent =
                "Resolved";
        }
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
                    "/topic/alerts",
                    message => {

                        const alert =
                            JSON.parse(
                                message.body
                            );


                        handleLiveAlert(
                            alert
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
       LIVE ALERT UPDATE
    ========================================= */

    function handleLiveAlert(alert) {

        alerts.set(
            alert.id,
            alert
        );


        totalAlerts.textContent =
            alerts.size;


        renderAlertList();


        /*
         * If this is the currently selected
         * alert, update the detail panel too.
         */

        if (
            selectedAlertId ===
            alert.id
        ) {

            renderAlertDetails(
                alert
            );
        }
    }


    /* =========================================
       ALERT TYPE FORMATTER
    ========================================= */

    function formatAlertType(
        alertType
    ) {

        return alertType

            .replaceAll(
                "_",
                " "
            )

            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
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