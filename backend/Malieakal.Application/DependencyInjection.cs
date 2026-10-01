using Microsoft.Extensions.DependencyInjection;

namespace Malieakal.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // Register application services, mediators, validation here
            return services;
        }
    }
}
