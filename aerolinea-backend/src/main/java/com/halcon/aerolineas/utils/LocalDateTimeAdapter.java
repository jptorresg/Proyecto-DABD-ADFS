package com.halcon.aerolineas.utils;

import com.google.gson.*;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Adaptador de Gson para serializar y deserializar objetos {@link LocalDateTime}
 * en formato ISO (YYYY-MM-DDTHH:MM:SS).
 * <p>
 * Permite que Gson maneje correctamente las fechas y horas de la API {@code java.time}
 * al convertir objetos Java a JSON y viceversa.
 * </p>
 */
public class LocalDateTimeAdapter implements JsonSerializer<LocalDateTime>, JsonDeserializer<LocalDateTime> {
    
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    /**
     * Serializa un objeto {@link LocalDateTime} a un elemento JSON.
     * <p>
     * Convierte la fecha y hora a una cadena en formato ISO (YYYY-MM-DDTHH:MM:SS) y la
     * devuelve como un {@link JsonPrimitive}.
     * </p>
     *
     * @param dateTime El objeto {@link LocalDateTime} a serializar.
     * @param typeOfSrc El tipo del objeto fuente.
     * @param context El contexto de serialización.
     * @return Un {@link JsonPrimitive} que contiene la fecha y hora en formato ISO.
     */
    @Override
    public JsonElement serialize(LocalDateTime dateTime, Type typeOfSrc, JsonSerializationContext context) {
        return new JsonPrimitive(dateTime.format(formatter));
    }
    
    /**
     * Deserializa un elemento JSON a un objeto {@link LocalDateTime}.
     * <p>
     * Espera que el elemento JSON sea una cadena en formato ISO (YYYY-MM-DDTHH:MM:SS).
     * </p>
     *
     * @param json    El elemento JSON a deserializar.
     * @param typeOfT El tipo del objeto destino.
     * @param context El contexto de deserialización.
     * @return Un objeto {@link LocalDateTime} correspondiente a la fecha y hora representadas.
     * @throws java.time.format.DateTimeParseException Si la cadena no tiene el formato ISO esperado.
     */
    @Override
    public LocalDateTime deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) {
        return LocalDateTime.parse(json.getAsString(), formatter);
    }
}