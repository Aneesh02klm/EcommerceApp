using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    public class BannerController : ControllerBase
    {
        private readonly IBannerRepository _bannerRepository;

        public BannerController(IBannerRepository bannerRepository)
        {
            _bannerRepository = bannerRepository;
        }

        [HttpGet("api/v1/banners/admin")]
        [Authorize]
        public async Task<IActionResult> GetAllAdmin()
        {
            var banners = await _bannerRepository.GetAllAsync();
            return Ok(new { success = true, data = banners, message = "Banners retrieved successfully." });
        }

        [HttpGet("api/v1/banners/admin/{id}")]
        [Authorize]
        public async Task<IActionResult> GetByIdAdmin(int id)
        {
            var banner = await _bannerRepository.GetByIdAsync(id);
            if (banner == null) return NotFound(new { success = false, message = "Banner not found" });
            return Ok(new { success = true, data = banner, message = "Banner retrieved successfully." });
        }

        [HttpPost("api/v1/banners/admin")]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] Banner banner)
        {
            var id = await _bannerRepository.CreateAsync(banner);
            banner.Id = id;
            return Ok(new { success = true, data = banner, message = "Banner created successfully." });
        }

        [HttpPut("api/v1/banners/admin/{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] Banner banner)
        {
            banner.Id = id;
            await _bannerRepository.UpdateAsync(banner);
            return Ok(new { success = true, data = banner, message = "Banner updated successfully." });
        }

        [HttpDelete("api/v1/banners/admin/{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            await _bannerRepository.DeleteAsync(id);
            return Ok(new { success = true, message = "Banner deleted successfully." });
        }

        [HttpGet("api/v1/banners/resolve")]
        public async Task<IActionResult> ResolveBanners([FromQuery] string? categorySlug, [FromQuery] string? brandSlug)
        {
            var banners = await _bannerRepository.GetActiveBannersAsync(categorySlug, brandSlug);
            return Ok(new { success = true, data = banners, message = "Banners resolved." });
        }
    }
}
