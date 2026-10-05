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
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCors", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
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
              "Database/108_AdminModules.sql",
              "Database/109_FinalAdminModules.sql", "Database/110_SpecsGroup.sql", "Database/112_FixSequence.sql", "Database/111_UniversalCategorySpecs.sql", "Database/113_MobileCategorySpecs.sql", "Database/114_SpecificationGroups.sql",
            "Database/115_CategoryNav.sql",
              "Database/116_Storefront.sql",
              "Database/117_SeedStorefront.sql",
              "Database/119_FinalSeed.sql",
              "Database/120_DiscoverMore.sql",
              "Database/121_AutomatedGrids.sql",
              "Database/123_AddIsBestSeller.sql",
              "Database/124_CouponsUpgrade.sql",
              "Database/125_ProductDiscountType.sql",
              "Database/126_CatalogPromotions.sql",
              "Database/127_StorefrontIndexes.sql",
              "Database/128_CatalogPromotionsAdvanced.sql",
            "Database/129_FlashSales.sql",
              "Database/122_DraftPublish.sql",
            "Database/116_CouponUsageLimit.sql",
            "Database/108_AddVariantIdToCartItems.sql",
            "Database/123_OrderWorkflow.sql",
            "Database/124_SyncCouponCounts.sql", "Database/130_GranularPromotions.sql", "Database/108_NormalizePromotions.sql", "Database/131_SyncSpecifications.sql"
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
                try {
                    var sql = File.ReadAllText(path);
                    using var cmd = new Npgsql.NpgsqlCommand(sql, targetConn);
                    cmd.ExecuteNonQuery();
                } catch (Exception ex) {
                    Console.WriteLine($"DB Init Error in {file}: {ex.Message}");
                }
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
app.UseCors("SignalRCors");

// app.UseHttpsRedirection();

// Serve static files (used for file uploads in wwwroot)
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();


using (var scope = app.Services.CreateScope())
{
    var connectionFactory = scope.ServiceProvider.GetRequiredService<Malieakal.Application.Abstractions.IDbConnectionFactory>();
    using var connection = connectionFactory.CreateConnection();
    var sql = @"
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT u.Id, r.Id FROM Users u, Roles r 
        WHERE u.Email = 'admin@ecommerce.com' AND r.Name = 'Admin'
        ON CONFLICT DO NOTHING;
    ";
    Dapper.SqlMapper.Execute(connection, sql);
}

app.MapControllers();
app.MapHub<Malieakal.Api.Hubs.StorefrontHub>("/hubs/storefront");

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
