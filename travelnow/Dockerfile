# ── Imagen base ────────────────────────────────────────────
FROM node:22-alpine

# Instalar cliente MySQL solo para el healthcheck de conexión
RUN apk add --no-cache mysql-client

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p public/comprobantes

EXPOSE 3001

# Script de arranque: verifica BD y luego levanta la app
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["docker-entrypoint.sh"]