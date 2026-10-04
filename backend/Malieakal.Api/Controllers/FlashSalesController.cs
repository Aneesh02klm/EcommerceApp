using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/flash-sales")]
    public class FlashSalesController : ControllerBase
    {
        private readonly IDbConnectionFactory _dbFactory;

        public FlashSalesController(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        private async Task PopulateItems(IDbConnection connection, System.Collections.Generic.List<FlashSale> sales)
        {
            if (!sales.Any()) return;
            var saleIds = sales.Select(s => s.Id).ToList();
            var itemsSql = @"SELECT ProductId as Id, Sku, Name, ImageUrl, Mrp, DiscountType, Discount, FlashSaleId 
                             FROM FlashSaleItems 
                             WHERE FlashSaleId = ANY(@Ids)";
            var items = await connection.QueryAsync<dynamic>(itemsSql, new { Ids = saleIds });
            
            foreach (var sale in sales)
            {
                sale.SpecificProducts = items.Where(i => i.flashsaleid == sale.Id).Select(i => new SpecificProductDto {
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
            var sql = "SELECT Id, Title, StartTime, EndTime, IsActive, DiscountValue, TargetType, TargetCategoryId, TargetBrandId FROM FlashSales ORDER BY StartTime DESC";
            var sales = (await connection.QueryAsync<FlashSale>(sql)).ToList();
            await PopulateItems(connection, sales);
            return Ok(new { success = true, data = sales });
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT Id, Title, StartTime, EndTime, IsActive, DiscountValue, TargetType, TargetCategoryId, TargetBrandId FROM FlashSales 
                WHERE IsActive = true 
                  AND (NOW() AT TIME ZONE 'UTC') BETWEEN StartTime AND EndTime
            ";
            var activeSales = (await connection.QueryAsync<FlashSale>(sql)).ToList();
            await PopulateItems(connection, activeSales);
            return Ok(new { success = true, data = activeSales });
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT Id, Title, StartTime, EndTime, IsActive, DiscountValue, TargetType, TargetCategoryId, TargetBrandId FROM FlashSales WHERE Id = @Id";
            var sale = await connection.QueryFirstOrDefaultAsync<FlashSale>(sql, new { Id = id });
            if (sale == null) return NotFound(new { success = false, message = "Flash sale not found." });
            
            var list = new System.Collections.Generic.List<FlashSale> { sale };
            await PopulateItems(connection, list);
            return Ok(new { success = true, data = sale });
        }
    

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] FlashSale sale)
        {
            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try {
                var sql = @"
                    INSERT INTO FlashSales (Title, StartTime, EndTime, IsActive, DiscountValue, TargetType, TargetCategoryId, TargetBrandId)
                    VALUES (@Title, @StartTime, @EndTime, @IsActive, @DiscountValue, @TargetType, @TargetCategoryId, @TargetBrandId)
                    RETURNING Id;
                ";
                var id = await connection.ExecuteScalarAsync<int>(sql, sale, transaction);
                sale.Id = id;

                if (sale.TargetType == "SpecificProducts" && sale.SpecificProducts != null && sale.SpecificProducts.Any())
                {
                    var itemsSql = @"
                        INSERT INTO FlashSaleItems (FlashSaleId, ProductId, Sku, Name, ImageUrl, Mrp, DiscountType, Discount)
                        VALUES (@FlashSaleId, @ProductId, @Sku, @Name, @ImageUrl, @Mrp, @DiscountType, @Discount);
                    ";
                    foreach(var item in sale.SpecificProducts) {
                        await connection.ExecuteAsync(itemsSql, new {
                            FlashSaleId = id,
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
                return CreatedAtAction(nameof(GetAll), new { id }, new { success = true, data = sale });
            } catch {
                transaction.Rollback();
                throw;
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] FlashSale sale)
        {
            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try {
                sale.Id = id;
                var sql = @"
                    UPDATE FlashSales 
                    SET Title = @Title, 
                        StartTime = @StartTime, 
                        EndTime = @EndTime, 
                        IsActive = @IsActive, 
                        DiscountValue = @DiscountValue,
                        TargetType = @TargetType, 
                        TargetCategoryId = @TargetCategoryId,
                        TargetBrandId = @TargetBrandId
                    WHERE Id = @Id
                ";
                var rowsAffected = await connection.ExecuteAsync(sql, sale, transaction);
                if (rowsAffected == 0) return NotFound(new { success = false, message = "Flash sale not found." });

                // Delete old items
                await connection.ExecuteAsync("DELETE FROM FlashSaleItems WHERE FlashSaleId = @Id", new { Id = id }, transaction);

                // Insert new items
                if (sale.TargetType == "SpecificProducts" && sale.SpecificProducts != null && sale.SpecificProducts.Any())
                {
                    var itemsSql = @"
                        INSERT INTO FlashSaleItems (FlashSaleId, ProductId, Sku, Name, ImageUrl, Mrp, DiscountType, Discount)
                        VALUES (@FlashSaleId, @ProductId, @Sku, @Name, @ImageUrl, @Mrp, @DiscountType, @Discount);
                    ";
                    foreach(var item in sale.SpecificProducts) {
                        await connection.ExecuteAsync(itemsSql, new {
                            FlashSaleId = id,
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
                return Ok(new { success = true, data = sale });
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
            var sql = "DELETE FROM FlashSales WHERE Id = @Id";
            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            if (rowsAffected == 0) return NotFound(new { success = false, message = "Flash sale not found." });
            return Ok(new { success = true, message = "Flash sale deleted successfully." });
        }
    }
}
