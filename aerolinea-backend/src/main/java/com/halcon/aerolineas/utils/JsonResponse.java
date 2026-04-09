package com.halcon.aerolineas.utils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Utilidad para generar respuestas JSON estandarizadas en la API.
 * <p>
 * Proporciona métodos para construir respuestas de éxito y error con un formato uniforme:
 * <pre>
 * {
 *   "success": true|false,
 *   "data": ...,
 *   "message": "..."
 * }
 * </pre>
 * 
 */
public class JsonResponse {
    
    private static final Gson gson = new GsonBuilder()
            .setPrettyPrinting()
            .registerTypeAdapter(LocalDate.class, new LocalDateAdapter())
            .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
            .create();
    
    /**
     * Retorna una respuesta JSON de éxito con los datos proporcionados.
     * El campo {@code message} se establece como {@code null}.
     *
     * @param data Los datos a incluir en la respuesta.
     * @return Una cadena JSON que representa la respuesta de éxito.
     */
    public static String success(Object data) {
        ResponseWrapper wrapper = new ResponseWrapper(true, data, null);
        return gson.toJson(wrapper);
    }
    
    /**
     * Retorna una respuesta JSON de éxito con un mensaje y datos asociados.
     *
     * @param message El mensaje descriptivo de la operación exitosa.
     * @param data    Los datos a incluir en la respuesta.
     * @return Una cadena JSON que representa la respuesta de éxito.
     */
    public static String success(String message, Object data) {
        ResponseWrapper wrapper = new ResponseWrapper(true, data, message);
        return gson.toJson(wrapper);
    }
    
    /**
     * Retorna una respuesta JSON de error con el mensaje especificado.
     * El campo {@code data} se establece como {@code null} y {@code success} como {@code false}.
     *
     * @param message El mensaje de error.
     * @return Una cadena JSON que representa la respuesta de error.
     */
    public static String error(String message) {
        ResponseWrapper wrapper = new ResponseWrapper(false, null, message);
        return gson.toJson(wrapper);
    }
    
    /**
     * Convierte un objeto Java en su representación JSON.
     *
     * @param obj El objeto a serializar.
     * @return Una cadena JSON que representa el objeto.
     */
    public static String toJson(Object obj) {
        return gson.toJson(obj);
    }
    
    /**
     * Convierte una cadena JSON en un objeto del tipo especificado.
     *
     * @param <T>      El tipo del objeto resultante.
     * @param json     La cadena JSON a deserializar.
     * @param classOfT La clase del tipo {@code T}.
     * @return Una instancia de {@code T} poblada con los datos del JSON.
     * @throws com.google.gson.JsonSyntaxException Si la cadena JSON tiene un formato inválido.
     */
    public static <T> T fromJson(String json, Class<T> classOfT) {
        return gson.fromJson(json, classOfT);
    }
    
    /**
     * Clase interna que envuelve la estructura estándar de respuesta JSON.
     */
    private static class ResponseWrapper {
        private boolean success;
        private Object data;
        private String message;
        
        /**
         * Constructor del envoltorio de respuesta.
         *
         * @param success Indica si la operación fue exitosa.
         * @param data    Los datos a incluir.
         * @param message El mensaje asociado.
         */
        public ResponseWrapper(boolean success, Object data, String message) {
            this.success = success;
            this.data = data;
            this.message = message;
        }
    }
}