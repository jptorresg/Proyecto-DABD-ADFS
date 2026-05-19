package com.halcon.sat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.halcon.sat.dto.BedlyEnvelope;
import com.halcon.sat.dto.BedlyReservaDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@Component
public class BedlyClient {

    private final RestTemplate http;
    private final String baseUrl;

    public BedlyClient(RestTemplate http,
                       @Value("${sat.bedly.base-url:http://localhost:5043}") String baseUrl) {
        this.http = http;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
    }

    public BedlyReservaDto getReservacion(int idReserva) {
        String url = baseUrl + "/api/reservaciones/" + idReserva;
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        try {
            ResponseEntity<BedlyEnvelope<BedlyReservaDto>> resp = http.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<BedlyEnvelope<BedlyReservaDto>>() {});

            BedlyEnvelope<BedlyReservaDto> body = resp.getBody();
            if (body == null || !body.isSuccess() || body.getData() == null) {
                throw new BedlyNotFoundException("Bedly devolvió sin data para reserva " + idReserva);
            }
            return body.getData();

        } catch (HttpClientErrorException.NotFound e) {
            throw new BedlyNotFoundException("Reserva " + idReserva + " no existe en Bedly");
        }
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public static class BedlyNotFoundException extends RuntimeException {
        public BedlyNotFoundException(String msg) { super(msg); }
    }
}
