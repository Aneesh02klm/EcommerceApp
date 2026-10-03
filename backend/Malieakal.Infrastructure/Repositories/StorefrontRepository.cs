using Dapper;
using System.Text.Json;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class StorefrontRepository : IStorefrontRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public StorefrontRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<JsonElement> GetDraftConfigAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "SELECT DraftJson FROM StorefrontConfig LIMIT 1";
            var jsonString = await connection.QueryFirstOrDefaultAsync<string>(sql);
            
            if (string.IsNullOrEmpty(jsonString)) return JsonSerializer.Deserialize<JsonElement>("{\"sections\":[]}");
            return JsonSerializer.Deserialize<JsonElement>(jsonString);
        }

        public async Task<JsonElement> GetPublishedConfigAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "SELECT PublishedJson FROM StorefrontConfig LIMIT 1";
            var jsonString = await connection.QueryFirstOrDefaultAsync<string>(sql);
            
            if (string.IsNullOrEmpty(jsonString)) return JsonSerializer.Deserialize<JsonElement>("{\"sections\":[]}");
            return JsonSerializer.Deserialize<JsonElement>(jsonString);
        }

        public async Task UpdateDraftConfigAsync(JsonElement configJson)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE StorefrontConfig 
                SET DraftJson = @DraftJson::jsonb, UpdatedAt = CURRENT_TIMESTAMP
                WHERE Id = (SELECT Id FROM StorefrontConfig LIMIT 1);
                
                INSERT INTO StorefrontConfig (DraftJson, PublishedJson)
                SELECT @DraftJson::jsonb, @DraftJson::jsonb
                WHERE NOT EXISTS (SELECT 1 FROM StorefrontConfig);
            ";
            await connection.ExecuteAsync(sql, new { DraftJson = configJson.GetRawText() });
        }

        public async Task PublishConfigAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE StorefrontConfig 
                SET PublishedJson = DraftJson, UpdatedAt = CURRENT_TIMESTAMP
                WHERE Id = (SELECT Id FROM StorefrontConfig LIMIT 1);
            ";
            await connection.ExecuteAsync(sql);
        }

        public async Task<int> CreatePreBookingAsync(PreBookingEnquiry enquiry)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO PreBookingEnquiries (FullName, ContactNumber, Email, VariantOfInterest, Notes, Status)
                VALUES (@FullName, @ContactNumber, @Email, @VariantOfInterest, @Notes, @Status)
                RETURNING Id;";
            return await connection.ExecuteScalarAsync<int>(sql, enquiry);
        }

        public async Task<IEnumerable<PreBookingEnquiry>> GetPreBookingsAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<PreBookingEnquiry>("SELECT * FROM PreBookingEnquiries ORDER BY CreatedAt DESC");
        }

        public async Task UpdatePreBookingStatusAsync(int id, string status)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("UPDATE PreBookingEnquiries SET Status = @Status WHERE Id = @Id", new { Id = id, Status = status });
        }
    }
}
