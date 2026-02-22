using HotelesAPI.Config;

var builder = WebApplication.CreateBuilder(args);

// Controladores
builder.Services.AddControllers();

// CORS - permite que el frontend HTML se conecte a la API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Middlewares
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// Probar conexión al iniciar
try
{
    DatabaseConfig.TestConnection();
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ Advertencia: {ex.Message}");
}

app.Run();