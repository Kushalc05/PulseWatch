# PulseWatch

### Real-Time IoT Device Monitoring & Alert Platform

[![Java](https://img.shields.io/badge/Java-25-orange)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-brightgreen)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://www.mysql.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time%20Updates-purple)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

PulseWatch is a **real-time IoT device monitoring and alert platform** built with Java and Spring Boot.

The platform uses software-simulated IoT devices that continuously generate temperature, humidity, and battery readings. These readings are sent to the backend, validated, stored in MySQL, evaluated against configurable thresholds, and used to generate and manage alerts.

The dashboard receives telemetry and alert updates in real time using WebSocket communication, allowing device and alert information to change without manually refreshing the page.

---

## 🚀 Live Demo

**[Open PulseWatch Live Demo](https://pulsewatch-d1yd.onrender.com/)**

## 💻 Source Code

**[View PulseWatch on GitHub](https://github.com/Kushalc05/PulseWatch)**

---

## 📌 Overview

PulseWatch demonstrates how a backend monitoring system can process continuous telemetry from multiple devices and convert that data into useful operational information.

### The system provides

- Device registration and monitoring
- Simulated IoT telemetry generation
- Temperature, humidity, and battery monitoring
- REST API-based telemetry ingestion
- Input validation
- MySQL data persistence
- Configurable monitoring thresholds
- Automatic alert generation
- Alert lifecycle management
- Duplicate alert prevention
- Automatic alert resolution
- Device online/offline detection
- Real-time WebSocket updates
- Dashboard-based monitoring
- Alert history
- Telemetry history
- Cloud deployment with a live demo

---

## ✨ Key Features

## 📡 Device Monitoring

PulseWatch monitors multiple software-simulated devices.

Each device contains:

- Device name
- Location
- Current status
- Last telemetry timestamp
- Temperature
- Humidity
- Battery level

Devices are automatically marked **ONLINE** when telemetry is received.

If telemetry stops arriving for the configured timeout period, the device is automatically marked **OFFLINE**.

---

## 🌡️ Telemetry Processing

Each simulated device periodically generates:

- Temperature
- Humidity
- Battery percentage

The readings are sent to the Spring Boot backend through a REST API.

The backend then:

1. Identifies the device
2. Validates the incoming readings
3. Updates the device status
4. Stores the telemetry in MySQL
5. Evaluates alert conditions
6. Sends real-time updates to connected dashboard clients

---

## 🚨 Alert Management

PulseWatch generates alerts when telemetry crosses configured thresholds.

### Supported Alert Types

- `HIGH_TEMPERATURE`
- `HIGH_HUMIDITY`
- `LOW_BATTERY`

### Alert Severity Levels

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

### Alert Lifecycle

~~~text
OPEN → ACKNOWLEDGED → RESOLVED
~~~

#### OPEN

The system has detected an abnormal condition.

#### ACKNOWLEDGED

An operator has reviewed the alert and acknowledged it.

#### RESOLVED

The abnormal condition has returned to a normal state and the system has automatically resolved the alert after consecutive normal readings.

---

## 🛡️ Duplicate Alert Prevention

PulseWatch prevents the system from continuously creating new alerts while the same abnormal condition continues.

For example:

~~~text
Temperature > 80°C
        ↓
Abnormal reading 1
        ↓
Abnormal reading 2
        ↓
Abnormal reading 3
        ↓
Create HIGH_TEMPERATURE alert
        ↓
Continue monitoring
~~~

If the condition remains abnormal, the existing active alert is reused instead of creating duplicate alerts for every telemetry reading.

---

## 🔄 Automatic Alert Resolution

Alerts are not immediately resolved after a single normal reading.

PulseWatch requires consecutive normal readings before resolving an alert. This reduces false resolutions caused by temporary fluctuations in telemetry.

Example:

~~~text
Abnormal → Abnormal → Abnormal
                    ↓
                  ALERT
                    ↓
              Normal → Normal
                    ↓
                 RESOLVED
~~~

---

## 📶 Device Online / Offline Detection

Every telemetry reading updates the device's `lastTelemetryAt` timestamp.

PulseWatch periodically checks this timestamp.

If a device has not sent telemetry within the configured timeout:

~~~text
ONLINE
  ↓
No telemetry received
  ↓
Timeout exceeded
  ↓
OFFLINE
~~~

When telemetry resumes:

~~~text
OFFLINE
   ↓
Telemetry received
   ↓
ONLINE
~~~

The status change is also pushed to the dashboard using WebSocket communication.

---

## 🏗️ System Architecture

![PulseWatch Architecture](docs/pulsewatch-architecture.png)

## High-Level Architecture

~~~text
                    ┌─────────────────────┐
                    │  Simulated Devices  │
                    │                     │
                    │ Temperature         │
                    │ Humidity            │
                    │ Battery             │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   Spring Boot API   │
                    │                     │
                    │ Telemetry Service   │
                    │ Alert Service       │
                    │ Device Monitoring   │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             ┌─────────────┐      ┌─────────────┐
             │    MySQL    │      │  WebSocket  │
             │             │      │ Real-Time   │
             │ Telemetry   │      │ Updates     │
             │ Devices     │      └──────┬──────┘
             │ Alerts      │             │
             └─────────────┘             ▼
                                  ┌─────────────────┐
                                  │    Dashboard    │
                                  │                 │
                                  │ Devices         │
                                  │ Telemetry       │
                                  │ Active Alerts   │
                                  │ Alert History   │
                                  └─────────────────┘
~~~

---

## 🔄 How PulseWatch Works

The complete monitoring flow is:

~~~text
1. Device generates telemetry
          ↓
2. Telemetry sent through REST API
          ↓
3. Backend validates the data
          ↓
4. Device status is updated
          ↓
5. Telemetry stored in MySQL
          ↓
6. Alert thresholds are evaluated
          ↓
7. Alert created / updated if required
          ↓
8. WebSocket broadcasts the update
          ↓
9. Dashboard updates automatically
~~~

---

## ⚙️ Alert Logic

Default threshold configuration:

| Metric | Default Threshold | Alert |
|---|---:|---|
| Temperature | > 80°C | `HIGH_TEMPERATURE` |
| Humidity | > 80% | `HIGH_HUMIDITY` |
| Battery | < 20% | `LOW_BATTERY` |

The thresholds are configurable through the application's threshold configuration functionality.

The system also uses consecutive reading counters to prevent alerts from being triggered by a single temporary abnormal reading.

---

## 🌐 Real-Time Communication

PulseWatch uses **WebSocket with STOMP** for real-time communication between the backend and dashboard.

The backend publishes updates to:

~~~text
/topic/telemetry
/topic/alerts
~~~

### Telemetry Updates

Telemetry updates can contain:

- Device readings
- Device status changes
- Latest telemetry information

### Alert Updates

Alert updates can contain:

- New alerts
- Alert acknowledgements
- Alert resolutions

This allows the dashboard to update without repeatedly refreshing the browser.

---

## 🧩 REST API

## Device APIs

### Register Device

~~~http
POST /api/devices?deviceName=Machine-01&location=Factory%20Floor%20A
~~~

### Get All Devices

~~~http
GET /api/devices
~~~

---

## Telemetry APIs

### Submit Telemetry

~~~http
POST /api/telemetry
~~~

Example request:

~~~json
{
  "deviceId": 1,
  "temperature": 72.5,
  "humidity": 48.2,
  "battery": 91.4
}
~~~

### Get All Telemetry

~~~http
GET /api/telemetry
~~~

### Get Telemetry for a Device

~~~http
GET /api/telemetry/device/{deviceId}
~~~

---

## Alert APIs

### Get All Alerts

~~~http
GET /api/alerts
~~~

### Get Active Alerts

~~~http
GET /api/alerts/active
~~~

### Acknowledge Alert

~~~http
PUT /api/alerts/{id}/acknowledge
~~~

### Resolve Alert

~~~http
PUT /api/alerts/{id}/resolve
~~~

---

## 🖥️ Dashboard

The PulseWatch dashboard provides a centralized view of the monitoring system.

It displays:

- Total devices
- Online devices
- Offline devices
- Current telemetry
- Active alerts
- Alert severity
- Recent activity
- Device status
- Real-time updates

The interface is designed around a monitoring workflow rather than simply displaying database records.

---

## 📚 Alert History

Alert history is maintained separately from the active monitoring view.

This allows operators to:

- Review previous alerts
- Identify alert types
- Check severity
- Review alert status
- Understand previous device issues

---

## 📊 Telemetry History

Telemetry history allows previously recorded readings to be retrieved for individual devices.

The backend provides device-specific telemetry through:

~~~http
GET /api/telemetry/device/{deviceId}
~~~

This provides a foundation for analyzing how device conditions change over time.

---

## 🛠️ Tech Stack

## Backend

- Java 25
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Bean Validation
- WebSocket
- STOMP
- Maven

## Database

- MySQL 8.0

## Frontend

- HTML5
- CSS3
- JavaScript

## Development & Deployment

- Git
- GitHub
- Docker
- Render
- Aiven MySQL

> Docker is used as deployment packaging for the hosted application. It is not required for the core application architecture.

---

## 📁 Project Structure

~~~text
PulseWatch/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── pulsewatch/
│   │   │           ├── config/
│   │   │           ├── controller/
│   │   │           ├── dto/
│   │   │           ├── entity/
│   │   │           ├── exception/
│   │   │           ├── repository/
│   │   │           ├── service/
│   │   │           ├── simulator/
│   │   │           └── PulsewatchApplication.java
│   │   │
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/
│   │       │   ├── js/
│   │       │   └── index.html
│   │       │
│   │       └── application.properties
│   │
│   └── test/
│
├── docs/
│   └── pulsewatch-architecture.png
│
├── Dockerfile
├── pom.xml
├── mvnw
├── mvnw.cmd
└── README.md
~~~

---

## 🤖 Device Simulation

PulseWatch uses software-simulated devices instead of physical IoT hardware.

For local development, `DeviceSimulator.java` runs as a standalone Java process and sends telemetry to the backend through REST APIs.

For the hosted deployment, `VirtualDeviceSimulatorService` runs inside the Spring Boot application and periodically generates telemetry for the deployed demo.

This allows the public demo to continuously demonstrate the monitoring workflow without requiring physical devices.

The simulator generates realistic changing values rather than sending the same fixed reading repeatedly.

---

## ☁️ Live Deployment

The production version of PulseWatch is deployed using:

~~~text
GitHub
   ↓
Render
   ↓
Spring Boot Application
   ├── Virtual Device Simulator
   ├── REST APIs
   ├── Alert Processing
   └── WebSocket
            ↓
        Aiven MySQL
            ↓
       Live Dashboard
~~~

## Deployment Configuration

The application uses environment variables for production database configuration.

Database credentials are not stored in the source code.

Example configuration:

~~~properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/pulsewatch}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
~~~

The hosted simulator is enabled through:

~~~text
PULSEWATCH_SIMULATOR_ENABLED=true
~~~

---

## 💻 Running Locally

## 1. Clone the Repository

~~~bash
git clone https://github.com/Kushalc05/PulseWatch.git
cd PulseWatch
~~~

## 2. Create the MySQL Database

Create a database named:

~~~sql
CREATE DATABASE pulsewatch;
~~~

## 3. Configure Database Credentials

Set the required environment variables.

### Windows PowerShell

~~~powershell
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="YOUR_MYSQL_PASSWORD"
~~~

The application uses the following database URL by default:

~~~text
jdbc:mysql://localhost:3306/pulsewatch
~~~

## 4. Start the Spring Boot Application

### Windows

~~~powershell
.\mvnw.cmd spring-boot:run
~~~

The application starts on:

~~~text
http://localhost:8080
~~~

## 5. Start the Local Device Simulator

Run:

~~~text
DeviceSimulator.java
~~~

The simulator sends telemetry to:

~~~text
http://localhost:8080/api/telemetry
~~~

The dashboard can then be opened at:

~~~text
http://localhost:8080
~~~

---

## ✅ Validation & Error Handling

PulseWatch validates incoming telemetry before processing it.

Example validation rules:

~~~text
Temperature: -50°C to 150°C
Humidity:      0% to 100%
Battery:       0% to 100%
~~~

Invalid telemetry requests are rejected with an appropriate HTTP error response.

The application also handles missing resources such as non-existent device IDs using custom exceptions.

Example:

~~~text
Device not found with id: 99
~~~

This returns an HTTP `404 Not Found` response.

---

## 🗄️ Database Model

The primary database entities are:

## Device

Stores information about monitored devices.

~~~text
Device
------
id
deviceName
location
status
createdAt
lastTelemetryAt
~~~

## Telemetry

Stores readings generated by devices.

~~~text
Telemetry
---------
id
device_id
temperature
humidity
battery
recordedAt
~~~

## Alert

Stores detected abnormal conditions.

~~~text
Alert
-----
id
device_id
alertType
severity
status
message
createdAt
~~~

### Relationships

~~~text
Device
  │
  ├──────────< Telemetry
  │
  └──────────< Alert
~~~

One device can have many telemetry records and many alerts.

---

## 🧠 Design Approach

PulseWatch follows a layered backend architecture:

~~~text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
~~~

## Controller Layer

Responsible for:

- HTTP endpoints
- Request handling
- Request validation
- Response handling

## Service Layer

Responsible for:

- Business logic
- Telemetry processing
- Alert evaluation
- Device monitoring
- Alert lifecycle management
- WebSocket notifications

## Repository Layer

Responsible for:

- Database operations
- Entity persistence
- Query methods

## Entity Layer

Represents the database model and domain objects.

---

## 🔧 Engineering Decisions

## Why REST APIs?

REST provides a simple and widely used communication mechanism for sending telemetry from simulated devices to the backend.

## Why WebSocket?

Traditional polling would require the dashboard to repeatedly request new information.

WebSocket allows the backend to push updates to connected clients as soon as relevant events occur.

## Why MySQL?

Telemetry, devices, and alerts are structured relational data with clear relationships, making MySQL suitable for the project's requirements.

## Why Software-Simulated Devices?

The project focuses on backend monitoring and alert processing rather than physical hardware.

Simulation allows the complete telemetry pipeline to be demonstrated without requiring sensors or embedded hardware.

## Why In-Memory Alert Counters?

The abnormal and normal reading counters are maintained in application memory for the current MVP.

This keeps the implementation simple while demonstrating the alert evaluation logic.

---

## ⚠️ Current Limitations

PulseWatch is a portfolio and learning project rather than a production-scale IoT platform.

Current limitations include:

- Devices are software-simulated rather than physical IoT hardware.
- Alert reading counters are maintained in application memory.
- WebSocket communication uses Spring's simple broker.
- Authentication and authorization are not currently implemented.
- The hosted demo uses free-tier infrastructure and therefore has resource and availability limitations.
- The monitoring system is designed for demonstration and moderate workloads rather than large-scale industrial deployments.

---

## 🚀 Future Improvements

Potential future improvements include:

- Persistent monitoring state
- User authentication and authorization
- Device registration and management UI
- Advanced telemetry visualization
- Historical charts and analytics
- Email or push notifications
- Real IoT protocol integration such as MQTT
- Persistent alert-processing state
- Scalable messaging infrastructure
- Production-grade monitoring and observability
- Higher-scale cloud infrastructure

These improvements are intentionally kept outside the current MVP to maintain a focused and understandable architecture.

---

## 🎯 Project Goal

The main goal of PulseWatch was to build an interview-defensible backend project demonstrating practical understanding of:

- Java
- Spring Boot
- REST API development
- Spring Data JPA
- Hibernate
- MySQL
- Validation
- Exception handling
- Business logic
- Real-time communication
- WebSocket
- Scheduled background processing
- Database relationships
- Software simulation
- Git and GitHub
- Cloud deployment

The project focuses on implementing a complete working system rather than adding technologies purely to make the stack appear larger.

---

## 📌 Project Status

**PulseWatch is currently deployed and functional.**

The deployed system has been verified to:

- Generate simulated device telemetry
- Store telemetry in MySQL
- Display devices on the dashboard
- Update device readings in real time
- Detect threshold violations
- Generate alerts
- Prevent duplicate active alerts
- Acknowledge alerts
- Resolve alerts
- Detect device online/offline status
- Push updates through WebSocket
- Run using a hosted database
- Provide a publicly accessible live demo

---

## 👨‍💻 Author

**Kushal C**

B.Tech Computer Science & Engineering

Java Backend / Software Developer

- **GitHub:** [github.com/Kushalc05](https://github.com/Kushalc05)
- **LinkedIn:** [linkedin.com/in/kushal-c-sde](https://www.linkedin.com/in/kushal-c-sde)

---

## 🌐 PulseWatch

**[Launch PulseWatch](https://pulsewatch-d1yd.onrender.com/)**

**[View Source Code](https://github.com/Kushalc05/PulseWatch)**

---

⭐ If you found this project interesting, feel free to explore the repository.
