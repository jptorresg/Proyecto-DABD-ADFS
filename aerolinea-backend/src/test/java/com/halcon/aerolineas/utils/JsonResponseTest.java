package com.halcon.aerolineas.utils;

import static org.junit.jupiter.api.Assertions.*;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class JsonResponseTest {

    @Test
    void testSuccessWithDataOnly() {
        String json = JsonResponse.success("dato");

        JsonObject obj = JsonParser.parseString(json).getAsJsonObject();

        assertTrue(obj.get("success").getAsBoolean());
        assertEquals("dato", obj.get("data").getAsString());

        // 🔥 FIX
        assertFalse(obj.has("message"), "message no debería existir cuando es null");
    }

    @Test
    void testSuccessWithMessageAndData() {
        String json = JsonResponse.success("Operación exitosa", 123);

        JsonObject obj = JsonParser.parseString(json).getAsJsonObject();

        assertTrue(obj.get("success").getAsBoolean());
        assertEquals(123, obj.get("data").getAsInt());
        assertEquals("Operación exitosa", obj.get("message").getAsString());
    }

    @Test
    void testErrorResponse() {
        String json = JsonResponse.error("Ocurrió un error");

        JsonObject obj = JsonParser.parseString(json).getAsJsonObject();

        assertFalse(obj.get("success").getAsBoolean());

        // 🔥 FIX
        assertFalse(obj.has("data"), "data no debería existir cuando es null");

        assertEquals("Ocurrió un error", obj.get("message").getAsString());
    }

    @Test
    void testToJsonAndFromJson() {
        TestObject original = new TestObject("Juan", 25);

        String json = JsonResponse.toJson(original);
        TestObject result = JsonResponse.fromJson(json, TestObject.class);

        assertNotNull(result);
        assertEquals("Juan", result.nombre);
        assertEquals(25, result.edad);
    }

    @Test
    void testToJsonWithLocalDate() {
        TestDateObject obj = new TestDateObject(LocalDate.of(2026, 4, 9));

        String json = JsonResponse.toJson(obj);

        assertTrue(json.contains("2026-04-09"));
    }

    @Test
    void testToJsonWithLocalDateTime() {
        TestDateTimeObject obj = new TestDateTimeObject(
                LocalDateTime.of(2026, 4, 9, 10, 30, 0));

        String json = JsonResponse.toJson(obj);

        assertTrue(json.contains("2026-04-09T10:30:00"));
    }

    @Test
    void testFromJsonInvalidFormat() {
        // 🔥 FIX: JSON realmente inválido
        String invalidJson = "{ nombre: }";

        assertThrows(com.google.gson.JsonSyntaxException.class, () -> {
            JsonResponse.fromJson(invalidJson, TestObject.class);
        });
    }

    // Clases auxiliares

    static class TestObject {
        String nombre;
        int edad;

        public TestObject() {}

        public TestObject(String nombre, int edad) {
            this.nombre = nombre;
            this.edad = edad;
        }
    }

    static class TestDateObject {
        LocalDate fecha;

        public TestDateObject(LocalDate fecha) {
            this.fecha = fecha;
        }
    }

    static class TestDateTimeObject {
        LocalDateTime fechaHora;

        public TestDateTimeObject(LocalDateTime fechaHora) {
            this.fechaHora = fechaHora;
        }
    }
}