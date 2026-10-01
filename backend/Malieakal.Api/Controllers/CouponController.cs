using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/coupons")]
    public class CouponController : ControllerBase
    {
        private readonly ICouponRepository _couponRepository;

        public CouponController(ICouponRepository couponRepository)
        {
            _couponRepository = couponRepository;
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
    }
}
