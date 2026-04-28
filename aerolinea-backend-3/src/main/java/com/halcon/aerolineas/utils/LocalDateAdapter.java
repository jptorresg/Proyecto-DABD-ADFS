package com.halcon.aerolineas.utils;

import com.google.gson.*;
import java.lang.reflect.Type;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Adaptador de Gson para serializar y deserializar objetos {@link LocalDate}
 * en formato ISO (YYYY-MM-DD).
 * <p>
 * Permite que Gson maneje correctamente las fechas de la API {@code java.time}
 * al convertir objetos Java a JSON y viceversa.
 * </p>
 */
public class LocalDateAdapter implements JsonSerializer<LocalDate>, JsonDeserializer<LocalDate> {
    
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
    
    /**
     * Serializa un objeto {@link LocalDate} a un elemento JSON.
     * <p>
     * Convierte la fecha a una cadena en formato ISO (ej. "2026-04-09").
     * </p>
     *
     * @param date       El objeto {@code LocalDate} a serializar.
     * @param typeOfSrc  El tipo del objeto fuente.
     * @param context    El contexto de serialización.
     * @return Un {@link JsonPrimitive} que contiene la fecha en formato ISO.
     */
    @Override
    public JsonElement serialize(LocalDate date, Type typeOfSrc, JsonSerializationContext context) {
        return new JsonPrimitive(date.format(formatter));
    }
    
    /**
     * Deserializa un elemento JSON a un objeto {@link LocalDate}.
     * <p>
     * Espera que el elemento JSON sea una cadena en formato ISO (YYYY-MM-DD).
     * </p>
     *
     * @param json    El elemento JSON a deserializar.
     * @param typeOfT El tipo del objeto destino.
     * @param context El contexto de deserialización.
     * @return Un objeto {@link LocalDate} correspondiente a la fecha representada.
     * @throws DateTimeParseException Si la cadena no tiene el formato ISO esperado.
     */
    @Override
    public LocalDate deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) {
        return LocalDate.parse(json.getAsString(), formatter);
    }
}