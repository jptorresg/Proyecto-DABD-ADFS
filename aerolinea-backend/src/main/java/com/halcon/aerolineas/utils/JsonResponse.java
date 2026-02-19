package com.halcon.aerolineas.utils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class JsonResponse {
    private static final Gson gson = new GsonBuilder()
            .setPrettyPrinting()
            .registerTypeAdapter(LocalDate.class, new LocalDateAdapter())
            .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
            .create();
    
    public static String success(Object data) {
        ResponseWrapper wrapper = new ResponseWrapper(true, data, null);
        return gson.toJson(wrapper);
    }
    
    public static String success(String message, Object data) {
        ResponseWrapper wrapper = new ResponseWrapper(true, data, message);
        return gson.toJson(wrapper);
    }
    
    public static String error(String message) {
        ResponseWrapper wrapper = new ResponseWrapper(false, null, message);
        return gson.toJson(wrapper);
    }
    
    public static String toJson(Object obj) {
        return gson.toJson(obj);
    }
    
    public static <T> T fromJson(String json, Class<T> classOfT) {
        return gson.fromJson(json, classOfT);
    }
    
    private static class ResponseWrapper {
        private boolean success;
        private Object data;
        private String message;
        
        public ResponseWrapper(boolean success, Object data, String message) {
            this.success = success;
            this.data = data;
            this.message = message;
        }
    }
}