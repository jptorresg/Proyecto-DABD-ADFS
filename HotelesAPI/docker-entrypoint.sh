#!/bin/bash

echo "========================================"
echo "  Bedly HotelesAPI - Verificando BD     "
echo "========================================"
echo "  Host : host.docker.internal"
echo "  Puerto: 1433"
echo "  BD    : BedlyHoteles"
echo "========================================"

MAX_INTENTOS=15
INTENTO=1

while [ $INTENTO -le $MAX_INTENTOS ]; do
    # Intentar conectar al SQL Server local
    if timeout 3 bash -c "</dev/tcp/host.docker.internal/1433" 2>/dev/null; then
        echo "✔ Conexión a SQL Server exitosa → host.docker.internal:1433/BedlyHoteles"
        echo "  Iniciando HotelesAPI..."
        echo "========================================"
        exec dotnet HotelesAPI.dll
    fi

    echo "  Esperando SQL Server... intento $INTENTO/$MAX_INTENTOS"
    INTENTO=$((INTENTO + 1))
    sleep 3
done

echo "========================================"
echo "  ERROR: No se pudo conectar a SQL Server"
echo "  Asegúrate de que SQL Server esté corriendo"
echo "  y acepte conexiones externas (puerto 1433)"
echo "========================================"
exit 1