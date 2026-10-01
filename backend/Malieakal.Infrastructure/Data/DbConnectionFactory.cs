using System.Data;
using Malieakal.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Malieakal.Infrastructure.Data
{
    public class DbConnectionFactory : IDbConnectionFactory
    {
        private readonly string _connectionString;

        public DbConnectionFactory(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                                ?? throw new System.InvalidOperationException("DefaultConnection string is not configured.");
        }

        public IDbConnection CreateConnection()
        {
            return new NpgsqlConnection(_connectionString);
        }
    }
}
