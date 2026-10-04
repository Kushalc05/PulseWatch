package com.pulsewatch.simulator;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

public class DeviceSimulator {

    static class DeviceState {

        double temperature;
        double humidity;
        double battery;

        DeviceState(double temperature, double humidity, double battery) {
            this.temperature = temperature;
            this.humidity = humidity;
            this.battery = battery;
        }
    }

    public static void main(String[] args) throws Exception {

        HttpClient client = HttpClient.newHttpClient();
        Random random = new Random();

        Map<Long, DeviceState> devices = new HashMap<>();

        devices.put(2L, new DeviceState(72, 50, 100));
        devices.put(3L, new DeviceState(68, 55, 95));
        devices.put(4L, new DeviceState(75, 60, 90));
        devices.put(5L, new DeviceState(70, 45, 85));
        devices.put(6L, new DeviceState(78, 65, 80));

        while (true) {

            for (Map.Entry<Long, DeviceState> entry : devices.entrySet()) {

                Long deviceId = entry.getKey();
                DeviceState state = entry.getValue();

                // Temperature changes gradually
                state.temperature += random.nextDouble() * 6 - 3;

                // Humidity changes gradually
                state.humidity += random.nextDouble() * 6 - 3;

                // Battery gradually decreases
                state.battery -= 0.5 + random.nextDouble() * 0.5;

                // Keep sensor values within realistic ranges
                state.temperature =
                        Math.max(60, Math.min(95, state.temperature));

                state.humidity =
                        Math.max(30, Math.min(90, state.humidity));

                state.battery =
                        Math.max(0, Math.min(100, state.battery));

                String json = """
                        {
                            "deviceId": %d,
                            "temperature": %.2f,
                            "humidity": %.2f,
                            "battery": %.2f
                        }
                        """.formatted(
                        deviceId,
                        state.temperature,
                        state.humidity,
                        state.battery
                );

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(
                                "http://localhost:8080/api/telemetry"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .build();

                HttpResponse<String> response =
                        client.send(
                                request,
                                HttpResponse.BodyHandlers.ofString()
                        );

                System.out.println(
                        "Device ID: " + deviceId
                );

                System.out.printf(
                        "Temperature: %.2f%n",
                        state.temperature
                );

                System.out.printf(
                        "Humidity: %.2f%n",
                        state.humidity
                );

                System.out.printf(
                        "Battery: %.2f%n",
                        state.battery
                );

                System.out.println(
                        "Status: " + response.statusCode()
                );

                System.out.println("--------------------------------");
            }

            // Wait 5 seconds before the next telemetry cycle
            Thread.sleep(5000);
        }
    }
}