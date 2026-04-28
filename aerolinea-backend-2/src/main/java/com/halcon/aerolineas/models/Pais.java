package com.halcon.aerolineas.models;

/**
 * Representa un país según la nomenclatura ISO 3166.
 * <p>
 * Contiene los códigos alfa-2, alfa-3 y numérico, así como el nombre común
 * y el nombre oficial ISO del país.
 * </p>
 */
public class Pais {
    
    /** Identificador único del país en la base de datos. */
    private Long id;
    
    /** Nombre común del país (ej. "Guatemala"). */
    private String name;
    
    /** Nombre oficial según ISO (ej. "GUATEMALA"). */
    private String isoName;
    
    /** Código ISO alfa-2 de dos letras (ej. "GT"). */
    private String alfa2;
    
    /** Código ISO alfa-3 de tres letras (ej. "GTM"). */
    private String alfa3;
    
    /** Código ISO numérico de tres dígitos (ej. 320). */
    private Integer numerico;
    
    /**
     * Constructor por defecto.
     */
    public Pais() {}
    
    /**
     * Constructor con parámetros mínimos para inicializar un país.
     *
     * @param id     Identificador del país.
     * @param name   Nombre común del país.
     * @param alfa2  Código ISO alfa-2.
     */
    public Pais(Long id, String name, String alfa2) {
        this.id = id;
        this.name = name;
        this.alfa2 = alfa2;
    }
    
    // Getters y Setters
    
    /**
     * @return el identificador del país.
     */
    public Long getId() { return id; }
    
    /**
     * @param id el identificador del país.
     */
    public void setId(Long id) { this.id = id; }
    
    /**
     * @return el nombre común del país.
     */
    public String getName() { return name; }
    
    /**
     * @param name el nombre común del país.
     */
    public void setName(String name) { this.name = name; }
    
    /**
     * @return el nombre oficial ISO del país.
     */
    public String getIsoName() { return isoName; }
    
    /**
     * @param isoName el nombre oficial ISO del país.
     */
    public void setIsoName(String isoName) { this.isoName = isoName; }
    
    /**
     * @return el código ISO alfa-2.
     */
    public String getAlfa2() { return alfa2; }
    
    /**
     * @param alfa2 el código ISO alfa-2.
     */
    public void setAlfa2(String alfa2) { this.alfa2 = alfa2; }
    
    /**
     * @return el código ISO alfa-3.
     */
    public String getAlfa3() { return alfa3; }
    
    /**
     * @param alfa3 el código ISO alfa-3.
     */
    public void setAlfa3(String alfa3) { this.alfa3 = alfa3; }
    
    /**
     * @return el código ISO numérico.
     */
    public Integer getNumerico() { return numerico; }
    
    /**
     * @param numerico el código ISO numérico.
     */
    public void setNumerico(Integer numerico) { this.numerico = numerico; }
}