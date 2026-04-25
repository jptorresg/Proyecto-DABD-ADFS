# ── Etapa 1: Build ──────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src

COPY HotelesAPI.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish

# ── Etapa 2: Runtime ─────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

# Script de arranque que verifica la conexión antes de levantar la app
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5043

ENTRYPOINT ["/docker-entrypoint.sh"]