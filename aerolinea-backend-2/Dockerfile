# Imagen oficial de Tomcat 9 con JDK 17 (recomendado)
FROM tomcat:9.0-jdk17-temurin

# Eliminar aplicaciones por defecto de Tomcat
RUN rm -rf /usr/local/tomcat/webapps/*

# Copiar el archivo WAR generado por Maven
COPY target/aerolineas.war /usr/local/tomcat/webapps/aerolineas.war

# Exponer el puerto de Tomcat
EXPOSE 8080

# Iniciar Tomcat
CMD ["catalina.sh", "run"]