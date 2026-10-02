using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;
using Dapper;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/coupons")]
    public class CouponController : ControllerBase
    {
        [HttpPatch("admin/{id}/status")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            using var connection = _db.CreateConnection();
            var coupon = await connection.QuerySingleOrDefaultAsync<Malieakal.Domain.Entities.Coupon>("SELECT * FROM Coupons WHERE Id = @Id", new { Id = id });
            if (coupon == null) return NotFound(new { success = false, message = "Coupon not found" });

            coupon.IsActive = !coupon.IsActive;
            await connection.ExecuteAsync("UPDATE Coupons SET IsActive = @IsActive WHERE Id = @Id", new { IsActive = coupon.IsActive, Id = id });

            return Ok(new { success = true, data = coupon });
        }

        private readonly ICouponRepository _couponRepository;
        private readonly IDbConnectionFactory _db;

        public CouponController(ICouponRepository couponRepository, IDbConnectionFactory db)
        {
            _couponRepository = couponRepository;
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveCoupons()
        {
            var coupons = await _couponRepository.GetActiveCouponsAsync();
            return Ok(new { success = true, data = coupons });
        }

        [HttpGet("{code}")]
        public async Task<IActionResult> ValidateCoupon(string code)
        {
            var coupon = await _couponRepository.GetByCodeAsync(code);
            if (coupon == null) return NotFound(new { success = false, message = "Invalid or expired coupon code." });
            return Ok(new { success = true, data = coupon });
        }

        [HttpGet("admin")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAdmin()
        {
            using var connection = _db.CreateConnection();
            var coupons = await connection.QueryAsync<Malieakal.Domain.Entities.Coupon>("SELECT * FROM Coupons ORDER BY CreatedAt DESC");
            return Ok(new { success = true, data = coupons });
        }

        [HttpPost("admin")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        
        [HttpPut("admin/{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAdmin(int id, [FromBody] Malieakal.Domain.Entities.Coupon coupon)
        {
            using var connection = _db.CreateConnection();
            var sql = @"
                UPDATE Coupons 
                SET Code = @Code, DiscountType = @DiscountType, DiscountValue = @DiscountValue, 
                    MinOrderAmount = @MinOrderAmount, MaxDiscountAmount = @MaxDiscountAmount, 
                    ExpiryDate = @ExpiryDate, IsActive = @IsActive, AssignedToEmail = @AssignedToEmail, 
                    UsageLimit = @UsageLimit, UsageLimitPerUser = @UsageLimitPerUser
                WHERE Id = @Id;";
            coupon.Id = id;
            await connection.ExecuteAsync(sql, coupon);
            return Ok(new { success = true, data = coupon });
        }

        [HttpDelete("admin/{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAdmin(int id)
        {
            using var connection = _db.CreateConnection();
            await connection.ExecuteAsync("DELETE FROM Coupons WHERE Id = @Id", new { Id = id });
            return Ok(new { success = true });
        }

        
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAdmin([FromBody] Malieakal.Domain.Entities.Coupon coupon)
        {
            coupon.CreatedAt = System.DateTime.UtcNow;
            using var connection = _db.CreateConnection();
            var sql = @"
                INSERT INTO Coupons (Code, DiscountType, DiscountValue, MinOrderAmount, MaxDiscountAmount, ExpiryDate, IsActive, AssignedToEmail, UsageLimit, UsageLimitPerUser) 
                VALUES (@Code, @DiscountType, @DiscountValue, @MinOrderAmount, @MaxDiscountAmount, @ExpiryDate, @IsActive, @AssignedToEmail, @UsageLimit, @UsageLimitPerUser) RETURNING Id;";
            coupon.Id = await connection.ExecuteScalarAsync<int>(sql, coupon);
            return Ok(new { success = true, data = coupon });
        }
    }
}
