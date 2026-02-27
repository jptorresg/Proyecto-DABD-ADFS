using HotelesAPI.Config;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

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

// Inicializar conexión
DatabaseConfig.ConnectionString = builder.Configuration.GetConnectionString("SqlServer")
    ?? throw new Exception("No se encontró cadena de conexión");

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

try
{
    DatabaseConfig.TestConnection();
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ Advertencia: {ex.Message}");
}

app.Run();