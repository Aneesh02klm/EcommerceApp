using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Threading.Tasks;
using System.Linq;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/catalog-promotions")]
    public class CatalogPromotionsController : ControllerBase
    {
        private readonly IDbConnectionFactory _dbFactory;

        public CatalogPromotionsController(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        private async Task PopulateItems(IDbConnection connection, System.Collections.Generic.List<CatalogPromotion> promos)
        {
            if (!promos.Any()) return;
            var promoIds = promos.Select(s => s.Id).ToList();
            var itemsSql = @"SELECT ProductId as Id, Sku, Name, ImageUrl, Mrp, DiscountType, Discount, CatalogPromotionId 
                             FROM CatalogPromotionItems 
                             WHERE CatalogPromotionId = ANY(@Ids)";
            var items = await connection.QueryAsync<dynamic>(itemsSql, new { Ids = promoIds });
            
            foreach (var promo in promos)
            {
                promo.SpecificProducts = items.Where(i => i.catalogpromotionid == promo.Id).Select(i => new SpecificProductDto {
                    Id = i.id,
                    Sku = i.sku,
                    Name = i.name,
                    ImageUrl = i.imageurl,
                    Mrp = i.mrp,
                    DiscountType = i.discounttype,
                    Discount = i.discount
                }).ToList();
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT Id, Name, TargetType, TargetId, TargetCategoryId, TargetBrandId, DiscountType, DiscountValue, StartDate, EndDate, IsActive, CreatedAt FROM CatalogPromotions ORDER BY CreatedAt DESC";
            var promos = (await connection.QueryAsync<CatalogPromotion>(sql)).ToList();
            await PopulateItems(connection, promos);
            return Ok(new { success = true, data = promos });
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT Id, Name, TargetType, TargetId, TargetCategoryId, TargetBrandId, DiscountType, DiscountValue, StartDate, EndDate, IsActive, CreatedAt FROM CatalogPromotions 
                WHERE IsActive = true 
                  AND (NOW() AT TIME ZONE 'UTC') BETWEEN StartDate AND EndDate
            ";
            var activePromos = (await connection.QueryAsync<CatalogPromotion>(sql)).ToList();
            await PopulateItems(connection, activePromos);
            return Ok(new { success = true, data = activePromos });
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT Id, Name, TargetType, TargetId, TargetCategoryId, TargetBrandId, DiscountType, DiscountValue, StartDate, EndDate, IsActive, CreatedAt FROM CatalogPromotions WHERE Id = @Id";
            var promo = await connection.QueryFirstOrDefaultAsync<CatalogPromotion>(sql, new { Id = id });
            if (promo == null) return NotFound(new { success = false, message = "Promotion not found." });
            
            var list = new System.Collections.Generic.List<CatalogPromotion> { promo };
            await PopulateItems(connection, list);
            return Ok(new { success = true, data = promo });
        }
    

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CatalogPromotion promo)
        {
            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try {
                var sql = @"
                    INSERT INTO CatalogPromotions (Name, TargetType, TargetId, TargetCategoryId, TargetBrandId, DiscountType, DiscountValue, StartDate, EndDate, IsActive)
                    VALUES (@Name, @TargetType, @TargetId, @TargetCategoryId, @TargetBrandId, @DiscountType, @DiscountValue, @StartDate, @EndDate, @IsActive)
                    RETURNING Id;
                ";
                var id = await connection.ExecuteScalarAsync<int>(sql, promo, transaction);
                promo.Id = id;

                if (promo.TargetType == "SpecificProducts" && promo.SpecificProducts != null && promo.SpecificProducts.Any())
                {
                    var itemsSql = @"
                        INSERT INTO CatalogPromotionItems (CatalogPromotionId, ProductId, Sku, Name, ImageUrl, Mrp, DiscountType, Discount)
                        VALUES (@CatalogPromotionId, @ProductId, @Sku, @Name, @ImageUrl, @Mrp, @DiscountType, @Discount);
                    ";
                    foreach(var item in promo.SpecificProducts) {
                        await connection.ExecuteAsync(itemsSql, new {
                            CatalogPromotionId = id,
                            ProductId = item.Id,
                            Sku = item.Sku,
                            Name = item.Name,
                            ImageUrl = item.ImageUrl,
                            Mrp = item.Mrp,
                            DiscountType = item.DiscountType,
                            Discount = item.Discount
                        }, transaction);
                    }
                }
                
                transaction.Commit();
                return CreatedAtAction(nameof(GetAll), new { id }, new { success = true, data = promo });
            } catch {
                transaction.Rollback();
                throw;
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CatalogPromotion promo)
        {
            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try {
                promo.Id = id;
                var sql = @"
                    UPDATE CatalogPromotions 
                    SET Name = @Name, 
                        TargetType = @TargetType, 
                        TargetId = @TargetId, 
                        TargetCategoryId = @TargetCategoryId, 
                        TargetBrandId = @TargetBrandId,
                        DiscountType = @DiscountType, 
                        DiscountValue = @DiscountValue, 
                        StartDate = @StartDate, 
                        EndDate = @EndDate, 
                        IsActive = @IsActive
                    WHERE Id = @Id
                ";
                var rowsAffected = await connection.ExecuteAsync(sql, promo, transaction);
                if (rowsAffected == 0) return NotFound(new { success = false, message = "Promotion not found." });

                // Delete old items
                await connection.ExecuteAsync("DELETE FROM CatalogPromotionItems WHERE CatalogPromotionId = @Id", new { Id = id }, transaction);

                // Insert new items
                if (promo.TargetType == "SpecificProducts" && promo.SpecificProducts != null && promo.SpecificProducts.Any())
                {
                    var itemsSql = @"
                        INSERT INTO CatalogPromotionItems (CatalogPromotionId, ProductId, Sku, Name, ImageUrl, Mrp, DiscountType, Discount)
                        VALUES (@CatalogPromotionId, @ProductId, @Sku, @Name, @ImageUrl, @Mrp, @DiscountType, @Discount);
                    ";
                    foreach(var item in promo.SpecificProducts) {
                        await connection.ExecuteAsync(itemsSql, new {
                            CatalogPromotionId = id,
                            ProductId = item.Id,
                            Sku = item.Sku,
                            Name = item.Name,
                            ImageUrl = item.ImageUrl,
                            Mrp = item.Mrp,
                            DiscountType = item.DiscountType,
                            Discount = item.Discount
                        }, transaction);
                    }
                }

                transaction.Commit();
                return Ok(new { success = true, data = promo });
            } catch {
                transaction.Rollback();
                throw;
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "DELETE FROM CatalogPromotions WHERE Id = @Id";
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            if (rowsAffected == 0) return NotFound(new { success = false, message = "Promotion not found." });
            return Ok(new { success = true, message = "Promotion deleted successfully." });
        }
    }
}
