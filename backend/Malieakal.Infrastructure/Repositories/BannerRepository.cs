using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class BannerRepository : IBannerRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public BannerRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<Banner>> GetAllAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Banner>("SELECT * FROM Banners ORDER BY SortOrder");
        }

        public async Task<Banner?> GetByIdAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Banner>("SELECT * FROM Banners WHERE Id = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(Banner banner)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"INSERT INTO Banners (ImageUrl, LinkUrl, DisplayStyle, IsActive, CategoryId, BrandId, SortOrder) 
                        VALUES (@ImageUrl, @LinkUrl, @DisplayStyle, @IsActive, @CategoryId, @BrandId, @SortOrder) RETURNING Id;";
            return await connection.ExecuteScalarAsync<int>(sql, banner);
        }

        public async Task UpdateAsync(Banner banner)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"UPDATE Banners SET ImageUrl = @ImageUrl, LinkUrl = @LinkUrl, DisplayStyle = @DisplayStyle, 
                        IsActive = @IsActive, CategoryId = @CategoryId, BrandId = @BrandId, SortOrder = @SortOrder 
                        WHERE Id = @Id;";
            await connection.ExecuteAsync(sql, banner);
        }

        public async Task DeleteAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM Banners WHERE Id = @Id", new { Id = id });
        }

        public async Task<IEnumerable<Banner>> GetActiveBannersAsync(string? categorySlug, string? brandSlug)
        {
            using var connection = _connectionFactory.CreateConnection();
            
            if (!string.IsNullOrEmpty(brandSlug))
            {
                var sql = @"SELECT b.* FROM Banners b INNER JOIN Brands br ON b.BrandId = br.Id WHERE b.IsActive = true AND br.Slug = @BrandSlug ORDER BY b.SortOrder";
                var banners = await connection.QueryAsync<Banner>(sql, new { BrandSlug = brandSlug });
                if (banners.Any()) return banners;
            }
            if (!string.IsNullOrEmpty(categorySlug))
            {
                var sql = @"SELECT b.* FROM Banners b INNER JOIN Categories c ON b.CategoryId = c.Id WHERE b.IsActive = true AND c.Slug = @CategorySlug ORDER BY b.SortOrder";
                var banners = await connection.QueryAsync<Banner>(sql, new { CategorySlug = categorySlug });
                if (banners.Any()) return banners;
            }
            
            return await connection.QueryAsync<Banner>("SELECT * FROM Banners WHERE IsActive = true AND CategoryId IS NULL AND BrandId IS NULL ORDER BY SortOrder");
        }
    }
}
