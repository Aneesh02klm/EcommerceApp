using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Threading.Tasks;

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
            EnsureTableExistsAsync().Wait();
        }

        private async Task EnsureTableExistsAsync()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                CREATE TABLE IF NOT EXISTS FlashSales (
                    Id SERIAL PRIMARY KEY,
                    Title VARCHAR(255) NOT NULL,
                    StartTime TIMESTAMP NOT NULL,
                    EndTime TIMESTAMP NOT NULL,
                    IsActive BOOLEAN DEFAULT TRUE,
                    DiscountValue DECIMAL(18,2) NOT NULL,
                    TargetType VARCHAR(50) NOT NULL,
                    TargetCategoryId INT NULL
                );
            ";
            await connection.ExecuteAsync(sql);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT * FROM FlashSales ORDER BY StartTime DESC";
            var sales = await connection.QueryAsync<FlashSale>(sql);
            return Ok(new { success = true, data = sales });
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT * FROM FlashSales 
                WHERE IsActive = true 
                  AND (NOW() AT TIME ZONE 'UTC') BETWEEN StartTime AND EndTime
            ";
            var activeSales = await connection.QueryAsync<FlashSale>(sql);
            return Ok(new { success = true, data = activeSales });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] FlashSale sale)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                INSERT INTO FlashSales (Title, StartTime, EndTime, IsActive, DiscountValue, TargetType, TargetCategoryId)
                VALUES (@Title, @StartTime, @EndTime, @IsActive, @DiscountValue, @TargetType, @TargetCategoryId)
                RETURNING Id;
            ";
            var id = await connection.ExecuteScalarAsync<int>(sql, sale);
            sale.Id = id;
            return CreatedAtAction(nameof(GetAll), new { id }, new { success = true, data = sale });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] FlashSale sale)
        {
            using var connection = _dbFactory.CreateConnection();
            sale.Id = id;
            var sql = @"
                UPDATE FlashSales 
                SET Title = @Title, 
                    StartTime = @StartTime, 
                    EndTime = @EndTime, 
                    IsActive = @IsActive, 
                    DiscountValue = @DiscountValue, 
                    TargetType = @TargetType, 
                    TargetCategoryId = @TargetCategoryId
                WHERE Id = @Id
            ";
            var rowsAffected = await connection.ExecuteAsync(sql, sale);
            if (rowsAffected == 0) return NotFound(new { success = false, message = "Flash sale not found." });
            return Ok(new { success = true, data = sale });
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
