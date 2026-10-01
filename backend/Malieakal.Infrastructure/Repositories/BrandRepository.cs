using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class BrandRepository : IBrandRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public BrandRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<Brand>> GetAllAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Brand>("SELECT * FROM Brands ORDER BY Name");
        }

        public async Task<Brand?> GetByIdAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Brand>("SELECT * FROM Brands WHERE Id = @Id", new { Id = id });
        }

        public async Task<int> CreateAsync(Brand brand)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO Brands (Name, Slug, Description, LogoUrl, IsActive, SeoTitle, SeoDescription)
                VALUES (@Name, @Slug, @Description, @LogoUrl, @IsActive, @SeoTitle, @SeoDescription)
                RETURNING Id;";
            return await connection.ExecuteScalarAsync<int>(sql, brand);
        }

        public async Task UpdateAsync(Brand brand)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE Brands 
                SET Name = @Name, Slug = @Slug, Description = @Description, LogoUrl = @LogoUrl, 
                    IsActive = @IsActive, SeoTitle = @SeoTitle, SeoDescription = @SeoDescription
                WHERE Id = @Id;";
            await connection.ExecuteAsync(sql, brand);
        }
    }
}
