using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public CategoryRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<Category>> GetAllAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Category>("SELECT * FROM Categories ORDER BY DisplayOrder");
        }

        public async Task<IEnumerable<Category>> GetTopNavCategoriesAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Category>("SELECT * FROM Categories WHERE IsActive = true AND ShowInTopNav = true ORDER BY DisplayOrder ASC");
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Category>("SELECT * FROM Categories WHERE Id = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(Category category)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO Categories (Name, Slug, Description, ImageUrl, IsActive, SeoTitle, SeoDescription, DisplayOrder, SpecificationTemplate, ShowInTopNav)
                VALUES (@Name, @Slug, @Description, @ImageUrl, @IsActive, @SeoTitle, @SeoDescription, @DisplayOrder, @SpecificationTemplate::jsonb, @ShowInTopNav)
                RETURNING Id;";
            return await connection.ExecuteScalarAsync<int>(sql, category);
        }

        public async Task UpdateAsync(Category category)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE Categories 
                SET Name = @Name, Slug = @Slug, Description = @Description, ImageUrl = @ImageUrl, 
                    IsActive = @IsActive, SeoTitle = @SeoTitle, SeoDescription = @SeoDescription, DisplayOrder = @DisplayOrder, SpecificationTemplate = @SpecificationTemplate::jsonb, ShowInTopNav = @ShowInTopNav
                WHERE Id = @Id;";
            await connection.ExecuteAsync(sql, category);
        }

        
        public async Task UpdateDisplayOrderAsync(List<int> orderedCategoryIds)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                var sql = "UPDATE Categories SET DisplayOrder = @Order WHERE Id = @Id";
                for (int i = 0; i < orderedCategoryIds.Count; i++)
                {
                    await connection.ExecuteAsync(sql, new { Order = i + 1, Id = orderedCategoryIds[i] }, transaction);
                }
                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task DeleteAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM Categories WHERE Id = @Id", new { Id = id });
        }
    }
}
