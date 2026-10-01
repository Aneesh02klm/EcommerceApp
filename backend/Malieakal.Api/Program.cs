using Dapper;
using Malieakal.Api.Middleware;
using Malieakal.Application;
using Malieakal.Infrastructure;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var jwtSettings = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
    };
});

// Register application & infrastructure layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
var app = builder.Build();

// INITIALIZE DATABASE
using (var scope = app.Services.CreateScope())
{
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var connStr = config.GetConnectionString("DefaultConnection");
    // Connect to 'postgres' database to create the target db if not exists
    var defaultDbConnStr = connStr.Replace("Database=ecommerce_db", "Database=postgres");
    try {
        using var conn = new Npgsql.NpgsqlConnection(defaultDbConnStr);
        conn.Open();
        var checkCmd = new Npgsql.NpgsqlCommand("SELECT 1 FROM pg_database WHERE datname = 'ecommerce_db'", conn);
        var exists = checkCmd.ExecuteScalar() != null;
        if (!exists) {
            var createCmd = new Npgsql.NpgsqlCommand("CREATE DATABASE ecommerce_db", conn);
            createCmd.ExecuteNonQuery();
        }
    } catch { } // Ignore errors if already exists or no permissions

    // Now connect to ecommerce_db and run all init scripts
    try {
        using var targetConn = new Npgsql.NpgsqlConnection(connStr);
        targetConn.Open();
        var schemaScripts = new[] {
            "Database/01_Init_Auth.sql",
            "Database/02_Init_Catalog.sql",
            "Database/03_Init_Commerce.sql",
            "Database/04_Init_Orders.sql",
            "Database/05_Init_CMS.sql",
            "Database/06_Init_Account.sql",
            "Database/105_CheckoutUpgrade.sql",
            "Database/106_Banners.sql",
            "Database/106_Logistics_Init.sql",
            "Database/106_PromoCodes.sql",
            "Database/107_OrderTracking.sql",
            "Database/108_AddVariantIdToCartItems.sql"
        };
        
        var seedScripts = new[] {
            "Database/99_Figma_Seed.sql", // Our pixel-perfect data
            "Database/100_DemoData.sql", // Extended catalog and demo customer
            "Database/101_DynamicSpecs_Seed.sql", // Applies JSONB specs
            "Database/102_DynamicVariants_Seed.sql",
            "Database/103_MoreVariants_Seed.sql",
            "Database/104_VariantImages_Seed.sql"
        };
        
        // 1. Run schema and safe alterations
        foreach(var file in schemaScripts) {
            var path = Path.Combine(Directory.GetCurrentDirectory(), file);
            if (File.Exists(path)) {
                var sql = File.ReadAllText(path);
                using var cmd = new Npgsql.NpgsqlCommand(sql, targetConn);
                cmd.ExecuteNonQuery();
            }
        }

        // 2. Safely seed dummy data ONLY if catalog is empty to prevent data loss
        var checkSeedCmd = new Npgsql.NpgsqlCommand("SELECT COUNT(*) FROM Categories", targetConn);
        long categoryCount = 1; // Default to non-empty
        try {
            categoryCount = (long)(checkSeedCmd.ExecuteScalar() ?? 1L);
        } catch { } // If error, assume not empty to be safe

        if (categoryCount == 0) {
            foreach(var file in seedScripts) {
                var path = Path.Combine(Directory.GetCurrentDirectory(), file);
                if (File.Exists(path)) {
                    var sql = File.ReadAllText(path);
                    using var cmd = new Npgsql.NpgsqlCommand(sql, targetConn);
                    cmd.ExecuteNonQuery();
                }
            }
        }
    } catch (Exception ex) {
        Console.WriteLine($"DB Init Error: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseCors("AllowNextJs");

// app.UseHttpsRedirection();

// Serve static files (used for file uploads in wwwroot)
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<Malieakal.Application.Abstractions.IDbConnectionFactory>();
    using var connection = db.CreateConnection();
    try {
        connection.Execute("ALTER TABLE Orders ADD COLUMN ShippingCharges DECIMAL(18,2) DEFAULT 0;");
    } catch {}
    try {
        connection.Execute("ALTER TABLE Payments ADD COLUMN Method VARCHAR(50) DEFAULT 'Online';");
    } catch {}
}
app.Run();
