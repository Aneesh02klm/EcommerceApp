using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class SpecificationRepository : ISpecificationRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public SpecificationRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<SpecificationDefinition>> GetByCategoryIdAsync(int categoryId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<SpecificationDefinition>(
                "SELECT * FROM SpecificationDefinitions WHERE CategoryId = @CategoryId AND IsActive = TRUE ORDER BY DisplayOrder",
                new { CategoryId = categoryId });
        }

        public async Task<SpecificationDefinition?> GetByIdAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<SpecificationDefinition>(
                "SELECT * FROM SpecificationDefinitions WHERE Id = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(SpecificationDefinition spec)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO SpecificationDefinitions (CategoryId, Name, DataType, IsRequired, Unit, AllowedValues, IsFilterable, IsSearchable, IsComparable, DisplayOrder, IsActive)
                VALUES (@CategoryId, @Name, @DataType, @IsRequired, @Unit, @AllowedValues, @IsFilterable, @IsSearchable, @IsComparable, @DisplayOrder, @IsActive)
                RETURNING Id;";
            return await connection.ExecuteScalarAsync<int>(sql, spec);
        }

        public async Task UpdateAsync(SpecificationDefinition spec)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE SpecificationDefinitions 
                SET CategoryId = @CategoryId, Name = @Name, DataType = @DataType, IsRequired = @IsRequired, Unit = @Unit,
                    AllowedValues = @AllowedValues, IsFilterable = @IsFilterable, IsSearchable = @IsSearchable,
                    IsComparable = @IsComparable, DisplayOrder = @DisplayOrder, IsActive = @IsActive
                WHERE Id = @Id;";
            await connection.ExecuteAsync(sql, spec);
        }

        public async Task DeleteAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM SpecificationDefinitions WHERE Id = @Id", new { Id = id });
        }
    }
}
