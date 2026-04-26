#!/bin/sh
set -e

echo "========================================"
echo "  TravelNow - Verificando conexión BD   "
echo "========================================"
echo "  Host : $DB_HOST"
echo "  Puerto: $DB_PORT"
echo "  BD    : $DB_NAME"
echo "  Usuario: $DB_USER"
echo "========================================"

MAX_INTENTOS=15
INTENTO=0

until mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" --silent 2>/dev/null; do
  INTENTO=$((INTENTO + 1))
  if [ "$INTENTO" -ge "$MAX_INTENTOS" ]; then
    echo ""
    echo "✗ ERROR: No se pudo conectar a MySQL en $DB_HOST:$DB_PORT"
    echo "  Verifica que tu MySQL local esté corriendo y que"
    echo "  acepte conexiones externas (no solo 127.0.0.1)."
    exit 1
  fi
  echo "  Esperando MySQL... intento $INTENTO/$MAX_INTENTOS"
  sleep 3
done

echo ""
echo "✔ Conexión a MySQL exitosa → $DB_HOST:$DB_PORT/$DB_NAME"
echo "  Iniciando TravelNow..."
echo "========================================"

exec node src/index.js