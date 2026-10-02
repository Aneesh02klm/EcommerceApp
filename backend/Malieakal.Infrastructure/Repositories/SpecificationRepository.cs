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

        public async Task<IEnumerable<SpecificationGroup>> GetGroupsAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<SpecificationGroup>("SELECT * FROM SpecificationGroups ORDER BY DisplayOrder, Name");
        }

        public async Task<int> CreateGroupAsync(SpecificationGroup group)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>("INSERT INTO SpecificationGroups (Name, DisplayOrder) VALUES (@Name, @DisplayOrder) RETURNING Id", group);
        }

        public async Task UpdateGroupAsync(SpecificationGroup group)
        {
            using var connection = _connectionFactory.CreateConnection();
            var oldName = await connection.ExecuteScalarAsync<string>("SELECT Name FROM SpecificationGroups WHERE Id = @Id", new { Id = group.Id });
            
            await connection.ExecuteAsync("UPDATE SpecificationGroups SET Name = @Name, DisplayOrder = @DisplayOrder WHERE Id = @Id", group);
            
            if (!string.IsNullOrEmpty(oldName) && oldName != group.Name)
            {
                // Cascade update to SpecificationDefinitions
                await connection.ExecuteAsync("UPDATE SpecificationDefinitions SET GroupName = @NewName WHERE GroupName = @OldName", new { NewName = group.Name, OldName = oldName });
            }
        }

        public async Task DeleteGroupAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM SpecificationGroups WHERE Id = @Id", new { Id = id });
        }

        public async Task<bool> IsGroupInUseAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            var name = await connection.ExecuteScalarAsync<string>("SELECT Name FROM SpecificationGroups WHERE Id = @Id", new { Id = id });
            if (string.IsNullOrEmpty(name)) return false;
            
            var count = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM SpecificationDefinitions WHERE GroupName = @Name", new { Name = name });
            if (count > 0) return true;
            
            // Also check Categories jsonb (a simple text search is enough to prevent deletion if mapped)
            var catCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Categories WHERE SpecificationTemplate::text LIKE '%' || @Name || '%'", new { Name = name });
            return catCount > 0;
        }

        public async Task<IEnumerable<SpecificationDefinition>> GetAllAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<SpecificationDefinition>("SELECT * FROM SpecificationDefinitions ORDER BY GroupName, DisplayOrder");
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
                INSERT INTO SpecificationDefinitions (CategoryId, GroupName, Name, DataType, IsRequired, Unit, AllowedValues, IsFilterable, IsSearchable, IsComparable, DisplayOrder, IsActive)
                VALUES (NULLIF(@CategoryId, 0), @GroupName, @Name, @DataType, @IsRequired, @Unit, @AllowedValues, @IsFilterable, @IsSearchable, @IsComparable, @DisplayOrder, @IsActive)
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
