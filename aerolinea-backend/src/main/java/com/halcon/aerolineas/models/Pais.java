package com.halcon.aerolineas.models;

public class Pais {
    private Long id;
    private String name;
    private String isoName;
    private String alfa2;
    private String alfa3;
    private Integer numerico;
    
    public Pais() {}
    
    public Pais(Long id, String name, String alfa2) {
        this.id = id;
        this.name = name;
        this.alfa2 = alfa2;
    }
    
    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getIsoName() { return isoName; }
    public void setIsoName(String isoName) { this.isoName = isoName; }
    
    public String getAlfa2() { return alfa2; }
    public void setAlfa2(String alfa2) { this.alfa2 = alfa2; }
    
    public String getAlfa3() { return alfa3; }
    public void setAlfa3(String alfa3) { this.alfa3 = alfa3; }
    
    public Integer getNumerico() { return numerico; }
    public void setNumerico(Integer numerico) { this.numerico = numerico; }
}