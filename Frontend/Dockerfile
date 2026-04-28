# ============================================
# Dockerfile - Frontend Bedly Hoteles
# ============================================
FROM nginx:1.27-alpine

LABEL maintainer="Bedly Hoteles"
LABEL description="Frontend estatico servido por Nginx"

# Eliminar configuracion por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar archivos del frontend (sin el nginx.conf, se monta vía volumen)
COPY ./ /usr/share/nginx/html/

# Limpiar archivos Docker
RUN rm -f /usr/share/nginx/html/Dockerfile \
    /usr/share/nginx/html/.dockerignore \
    /usr/share/nginx/html/nginx.conf \
    && rm -rf /usr/share/nginx/html/nginx-sucursal1 \
              /usr/share/nginx/html/nginx-sucursal2

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]