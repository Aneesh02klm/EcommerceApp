using Dapper;
using Npgsql;
using System.Collections.Generic;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.Extensions.Configuration;
using System;

namespace Malieakal.Infrastructure.Repositories
{
    public class CouponRepository : ICouponRepository
    {
        private readonly string _connectionString;

        public CouponRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        public async Task<Coupon?> GetByCodeAsync(string code)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QuerySingleOrDefaultAsync<Coupon>(
                @"SELECT * FROM Coupons 
                  WHERE Code = @Code AND IsActive = true 
                  AND (ExpiryDate IS NULL OR ExpiryDate > @Now)", 
                new { Code = code.ToUpper(), Now = DateTime.UtcNow });
        }

        public async Task<IEnumerable<Coupon>> GetActiveCouponsAsync()
        {
            using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryAsync<Coupon>(
                @"SELECT * FROM Coupons 
                  WHERE IsActive = true 
                  AND (ExpiryDate IS NULL OR ExpiryDate > @Now)",
                  new { Now = DateTime.UtcNow });
        }
    }
}
