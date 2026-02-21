package com.halcon.aerolineas;

import com.halcon.aerolineas.utils.PasswordUtil;

public class GeneratePasswordHash {
    public static void main(String[] args) {
        String hash = PasswordUtil.hashPassword("123");
        System.out.println(hash);
    }
}