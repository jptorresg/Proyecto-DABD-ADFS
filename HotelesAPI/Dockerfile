# ============================================
# STAGE 1: BUILD
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build

WORKDIR /src

COPY ["HotelesAPI.csproj", "./"]
RUN dotnet restore "HotelesAPI.csproj"

COPY . .

RUN dotnet build "HotelesAPI.csproj" -c Release -o /app/build

# ============================================
# STAGE 2: PUBLISH
# ============================================
FROM build AS publish
RUN dotnet publish "HotelesAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ============================================
# STAGE 3: RUNTIME
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS runtime

WORKDIR /app

COPY --from=publish /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true

# QuestPDF necesita esto para correr en contenedores Linux
ENV QuestPDF_License=Community

EXPOSE 8080

ENTRYPOINT ["dotnet", "HotelesAPI.dll"]