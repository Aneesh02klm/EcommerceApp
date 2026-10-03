using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Malieakal.Domain.Entities;
using Malieakal.Application.Abstractions;
using Dapper;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/catalog-promotions")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public class CatalogPromotionsController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;

        public CatalogPromotionsController(IDbConnectionFactory db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            using var connection = _db.CreateConnection();
            var promos = await connection.QueryAsync<CatalogPromotion>("SELECT * FROM CatalogPromotions ORDER BY CreatedAt DESC");
            return Ok(new { success = true, data = promos });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CatalogPromotion promo)
        {
            using var connection = _db.CreateConnection();
            promo.CreatedAt = System.DateTime.UtcNow;
            var sql = @"INSERT INTO CatalogPromotions (Name, TargetType, TargetId, TargetCategoryId, TargetBrandId, DiscountType, DiscountValue, StartDate, EndDate, IsActive, CreatedAt)
                        VALUES (@Name, @TargetType, @TargetId, @TargetCategoryId, @TargetBrandId, @DiscountType, @DiscountValue, @StartDate, @EndDate, @IsActive, @CreatedAt) RETURNING Id;";
            promo.Id = await connection.ExecuteScalarAsync<int>(sql, promo);
            return Ok(new { success = true, data = promo });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CatalogPromotion promo)
        {
            using var connection = _db.CreateConnection();
            promo.Id = id;
            var sql = @"UPDATE CatalogPromotions SET Name = @Name, TargetType = @TargetType, TargetId = @TargetId, TargetCategoryId = @TargetCategoryId, TargetBrandId = @TargetBrandId, 
                        DiscountType = @DiscountType, DiscountValue = @DiscountValue, StartDate = @StartDate, EndDate = @EndDate, IsActive = @IsActive
                        WHERE Id = @Id;";
            await connection.ExecuteAsync(sql, promo);
            return Ok(new { success = true, data = promo });
        }

        [HttpDelete("{id}")]
        
        [HttpGet("{id}/products")]
        public async Task<IActionResult> GetProducts(int id)
        {
            using var connection = _db.CreateConnection();
            var promo = await connection.QuerySingleOrDefaultAsync<CatalogPromotion>("SELECT * FROM CatalogPromotions WHERE Id = @Id", new { Id = id });
            if (promo == null) return NotFound(new { success = false });

            string whereClause = "1=1";
            var parameters = new DynamicParameters();

            if (promo.TargetType == "Category")
            {
                whereClause += " AND CategoryId = @CategoryId";
                parameters.Add("CategoryId", promo.TargetCategoryId);
                if (promo.TargetBrandId.HasValue)
                {
                    whereClause += " AND BrandId = @BrandId";
                    parameters.Add("BrandId", promo.TargetBrandId.Value);
                }
            }
            else if (promo.TargetType == "Brand")
            {
                whereClause += " AND BrandId = @BrandId";
                parameters.Add("BrandId", promo.TargetBrandId);
            }

            var sql = $"SELECT Id, Name, SKU, MRP FROM Products WHERE {whereClause} AND IsActive = true";
            var products = await connection.QueryAsync(sql, parameters);
            return Ok(new { success = true, data = new { count = products.Count(), products = products } });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using var connection = _db.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM CatalogPromotions WHERE Id = @Id", new { Id = id });
            return Ok(new { success = true });
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            using var connection = _db.CreateConnection();
            var promo = await connection.QuerySingleOrDefaultAsync<CatalogPromotion>("SELECT * FROM CatalogPromotions WHERE Id = @Id", new { Id = id });
            if (promo == null) return NotFound(new { success = false });

            await connection.ExecuteAsync("UPDATE CatalogPromotions SET IsActive = @IsActive WHERE Id = @Id", new { IsActive = !promo.IsActive, Id = id });
            return Ok(new { success = true });
        }
    }
}
