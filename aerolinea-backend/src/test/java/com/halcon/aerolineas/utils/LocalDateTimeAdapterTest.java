package com.halcon.aerolineas.utils;

import static org.junit.jupiter.api.Assertions.*;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

public class LocalDateTimeAdapterTest {

    private LocalDateTimeAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new LocalDateTimeAdapter();
    }

    @Test
    void testSerializeValidLocalDateTime() {
        LocalDateTime dateTime = LocalDateTime.of(2025, 4, 22, 15, 30, 45);

        JsonElement result = adapter.serialize(dateTime, null, null);

        assertNotNull(result, "El resultado no debería ser nulo");
        assertTrue(result instanceof JsonPrimitive, "Debe ser un JsonPrimitive");

        String expected = "2025-04-22T15:30:45";
        assertEquals(expected, result.getAsString(),
                "El formato debe ser ISO_LOCAL_DATE_TIME");
    }

    @Test
    void testDeserializeValidJson() {
        String jsonDate = "2025-04-22T15:30:45";
        JsonElement jsonElement = new JsonPrimitive(jsonDate);

        LocalDateTime result = adapter.deserialize(jsonElement, null, null);

        assertNotNull(result, "El resultado no debería ser nulo");

        LocalDateTime expected = LocalDateTime.of(2025, 4, 22, 15, 30, 45);
        assertEquals(expected, result,
                "Debe convertir correctamente a LocalDateTime");
    }

    @Test
    void testDeserializeInvalidFormat() {
        String invalidDate = "22-04-2025 15:30:45"; // formato incorrecto
        JsonElement jsonElement = new JsonPrimitive(invalidDate);

        assertThrows(Exception.class, () -> {
            adapter.deserialize(jsonElement, null, null);
        }, "Debe lanzar excepción si el formato no es ISO");
    }

    @Test
    void testSerializeAndDeserializeConsistency() {
        LocalDateTime original = LocalDateTime.of(2025, 12, 31, 23, 59, 59);

        JsonElement json = adapter.serialize(original, null, null);
        LocalDateTime result = adapter.deserialize(json, null, null);

        assertEquals(original, result,
                "Serializar y deserializar debería mantener el mismo valor");
    }

    @Test
    void testSerializeWithNull() {
        assertThrows(NullPointerException.class, () -> {
            adapter.serialize(null, null, null);
        }, "Debe lanzar NullPointerException al serializar null");
    }
}