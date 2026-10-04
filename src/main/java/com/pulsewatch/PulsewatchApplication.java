package com.pulsewatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class PulsewatchApplication {

    public static void main(String[] args) {
        SpringApplication.run(
                PulsewatchApplication.class,
                args
        );
    }
}