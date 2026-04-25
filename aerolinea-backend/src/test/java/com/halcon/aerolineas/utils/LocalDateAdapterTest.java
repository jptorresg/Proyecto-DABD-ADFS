package com.halcon.aerolineas.utils;

import static org.junit.jupiter.api.Assertions.*;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

public class LocalDateAdapterTest {

    private LocalDateAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new LocalDateAdapter();
    }

    @Test
    void testSerializeValidLocalDate() {
        LocalDate date = LocalDate.of(2026, 4, 9);

        JsonElement result = adapter.serialize(date, null, null);

        assertNotNull(result, "El resultado no debería ser nulo");
        assertTrue(result instanceof JsonPrimitive, "Debe ser un JsonPrimitive");

        String expected = "2026-04-09";
        assertEquals(expected, result.getAsString(),
                "El formato debe ser ISO_LOCAL_DATE");
    }

    @Test
    void testDeserializeValidJson() {
        String jsonDate = "2026-04-09";
        JsonElement jsonElement = new JsonPrimitive(jsonDate);

        LocalDate result = adapter.deserialize(jsonElement, null, null);

        assertNotNull(result, "El resultado no debería ser nulo");

        LocalDate expected = LocalDate.of(2026, 4, 9);
        assertEquals(expected, result,
                "Debe convertir correctamente a LocalDate");
    }

    @Test
    void testDeserializeInvalidFormat() {
        String invalidDate = "09-04-2026"; // formato incorrecto
        JsonElement jsonElement = new JsonPrimitive(invalidDate);

        assertThrows(Exception.class, () -> {
            adapter.deserialize(jsonElement, null, null);
        }, "Debe lanzar excepción si el formato no es ISO");
    }

    @Test
    void testSerializeAndDeserializeConsistency() {
        LocalDate original = LocalDate.of(2026, 12, 31);

        JsonElement json = adapter.serialize(original, null, null);
        LocalDate result = adapter.deserialize(json, null, null);

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