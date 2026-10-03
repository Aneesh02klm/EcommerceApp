using Malieakal.Application.Abstractions;
using Malieakal.Infrastructure.Data;
using Malieakal.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Malieakal.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
            services.AddSingleton<IFileStorageService, FileStorageService>();
            
            services.AddScoped<IPasswordHasher, Malieakal.Infrastructure.Auth.PasswordHasher>();
            services.AddScoped<IJwtService, Malieakal.Infrastructure.Auth.JwtService>();
            services.AddScoped<IUserRepository, Malieakal.Infrastructure.Repositories.UserRepository>();
            services.AddScoped<ICategoryRepository, Malieakal.Infrastructure.Repositories.CategoryRepository>();
            services.AddScoped<IProductRepository, Malieakal.Infrastructure.Repositories.ProductRepository>();
            services.AddScoped<ISpecificationRepository, Malieakal.Infrastructure.Repositories.SpecificationRepository>();
            services.AddScoped<IBrandRepository, Malieakal.Infrastructure.Repositories.BrandRepository>();
            services.AddScoped<IStorefrontRepository, Malieakal.Infrastructure.Repositories.StorefrontRepository>();
            services.AddScoped<ICartRepository, Malieakal.Infrastructure.Repositories.CartRepository>();
            services.AddScoped<IWishlistRepository, Malieakal.Infrastructure.Repositories.WishlistRepository>();
            services.AddScoped<IOrderRepository, Malieakal.Infrastructure.Repositories.OrderRepository>();
            services.AddScoped<INotificationRepository, Malieakal.Infrastructure.Repositories.NotificationRepository>();
            services.AddScoped<ICouponRepository, Malieakal.Infrastructure.Repositories.CouponRepository>();
            services.AddScoped<ILogisticsRepository, Malieakal.Infrastructure.Repositories.LogisticsRepository>();
            services.AddScoped<IPaymentService, Malieakal.Infrastructure.Services.RazorpayService>();
            services.AddScoped<IAccountRepository, Malieakal.Infrastructure.Repositories.AccountRepository>();
            services.AddScoped<IBannerRepository, Malieakal.Infrastructure.Repositories.BannerRepository>();
            services.AddScoped<IFileService, Malieakal.Infrastructure.Services.FileManagementService>();
            services.AddScoped<Malieakal.Application.Services.IDeliveryEngineService, Malieakal.Application.Services.DeliveryEngineService>();
            
            // Register Redis Distributed Cache
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration.GetConnectionString("RedisConnection") ?? "localhost:6379";
                options.InstanceName = "Malieakal_";
            });

            services.AddSingleton<ICacheService, Malieakal.Infrastructure.Services.RedisCacheService>();
            
            return services;
        }
    }
}
