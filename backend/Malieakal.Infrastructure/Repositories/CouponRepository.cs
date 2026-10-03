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

        public async Task<Coupon?> GetByCodeAsync(string code, Guid? userId = null)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QuerySingleOrDefaultAsync<Coupon>(
                @"SELECT * FROM Coupons 
                  WHERE Code = @Code AND IsActive = true 
                  AND (ExpiryDate IS NULL OR ExpiryDate > @Now) AND (UsageLimit IS NULL OR TimesUsed < UsageLimit) AND (UsageLimit IS NULL OR TimesUsed < UsageLimit) AND (@UserId IS NULL OR UsageLimitPerUser IS NULL OR (SELECT COUNT(*) FROM Orders WHERE PromoCode = Coupons.Code AND UserId = @UserId) < UsageLimitPerUser)", new { Code = code.ToUpper(), Now = DateTime.UtcNow, UserId = userId });
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

        public async Task IncrementUsageAsync(string code)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.ExecuteAsync(
                "UPDATE Coupons SET TimesUsed = TimesUsed + 1 WHERE Code = @Code",
                new { Code = code });
        }
    }
}
