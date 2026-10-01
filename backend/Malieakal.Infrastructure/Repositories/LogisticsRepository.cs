using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class LogisticsRepository : ILogisticsRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public LogisticsRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<LogisticsSettings> GetSettingsAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            var settings = await connection.QuerySingleOrDefaultAsync<LogisticsSettings>("SELECT * FROM LogisticsSettings WHERE Id = 1");
            return settings ?? new LogisticsSettings { Id = 1, StoreLat = 9.9312m, StoreLng = 76.2673m, FreeDeliveryRadiusKm = 25, ChargePerKm = 10, BaseFlatRate = 100 };
        }

        public async Task UpdateSettingsAsync(LogisticsSettings settings)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE LogisticsSettings 
                SET StoreLat = @StoreLat, StoreLng = @StoreLng, 
                    FreeDeliveryRadiusKm = @FreeDeliveryRadiusKm, ChargePerKm = @ChargePerKm, 
                    BaseFlatRate = @BaseFlatRate, UpdatedAt = CURRENT_TIMESTAMP
                WHERE Id = 1";
            await connection.ExecuteAsync(sql, settings);
        }

        public async Task<IEnumerable<StateDeliveryRule>> GetAllStateRulesAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<StateDeliveryRule>("SELECT * FROM StateDeliveryRules ORDER BY StateName");
        }

        public async Task<StateDeliveryRule?> GetStateRuleAsync(string stateName)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<StateDeliveryRule>(
                "SELECT * FROM StateDeliveryRules WHERE StateName = @StateName", new { StateName = stateName });
        }

        public async Task UpdateStateRuleAsync(StateDeliveryRule rule)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO StateDeliveryRules (StateName, FlatCharge, IsServiceable)
                VALUES (@StateName, @FlatCharge, @IsServiceable)
                ON CONFLICT (StateName) DO UPDATE 
                SET FlatCharge = @FlatCharge, IsServiceable = @IsServiceable, UpdatedAt = CURRENT_TIMESTAMP";
            await connection.ExecuteAsync(sql, rule);
        }

        public async Task DeleteStateRuleAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM StateDeliveryRules WHERE Id = @Id", new { Id = id });
        }

        public async Task<ServiceablePincode?> GetPincodeAsync(string pincode)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<ServiceablePincode>(
                "SELECT * FROM ServiceablePincodes WHERE Pincode = @Pincode", new { Pincode = pincode });
        }

        public async Task UpsertPincodeAsync(ServiceablePincode p)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO ServiceablePincodes (Pincode, City, StateName, Latitude, Longitude, EstimatedDeliveryDays, IsServiceable)
                VALUES (@Pincode, @City, @StateName, @Latitude, @Longitude, @EstimatedDeliveryDays, @IsServiceable)
                ON CONFLICT (Pincode) DO UPDATE 
                SET City = @City, StateName = @StateName, Latitude = @Latitude, Longitude = @Longitude, 
                    EstimatedDeliveryDays = @EstimatedDeliveryDays, IsServiceable = @IsServiceable, UpdatedAt = CURRENT_TIMESTAMP";
            await connection.ExecuteAsync(sql, p);
        }

        public async Task BulkUpsertPincodesAsync(IEnumerable<ServiceablePincode> pincodes)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var tx = connection.BeginTransaction();
            
            var sql = @"
                INSERT INTO ServiceablePincodes (Pincode, City, StateName, Latitude, Longitude, EstimatedDeliveryDays, IsServiceable)
                VALUES (@Pincode, @City, @StateName, @Latitude, @Longitude, @EstimatedDeliveryDays, @IsServiceable)
                ON CONFLICT (Pincode) DO UPDATE 
                SET City = @City, StateName = @StateName, Latitude = @Latitude, Longitude = @Longitude, 
                    EstimatedDeliveryDays = @EstimatedDeliveryDays, IsServiceable = @IsServiceable, UpdatedAt = CURRENT_TIMESTAMP";
            
            foreach (var chunk in pincodes.Chunk(500))
            {
                await connection.ExecuteAsync(sql, chunk, tx);
            }
            tx.Commit();
        }

        public async Task DeletePincodeAsync(string pincode)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM ServiceablePincodes WHERE Pincode = @Pincode", new { Pincode = pincode });
        }
    }
}
