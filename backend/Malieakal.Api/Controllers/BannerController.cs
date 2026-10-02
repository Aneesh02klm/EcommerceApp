using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    public class BannerFormDto
    {
        public IFormFile? Image { get; set; }
        public string? LinkUrl { get; set; }
        public string DisplayStyle { get; set; } = "Slider";
        public bool IsActive { get; set; } = true;
        public int? CategoryId { get; set; }
        public int? BrandId { get; set; }
        public int SortOrder { get; set; }
    }

    [ApiController]
    public class BannerController : ControllerBase
    {
        private readonly IBannerRepository _bannerRepository;
        private readonly IFileService _fileService;

        public BannerController(IBannerRepository bannerRepository, IFileService fileService)
        {
            _bannerRepository = bannerRepository;
            _fileService = fileService;
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
        public async Task<IActionResult> Create([FromForm] BannerFormDto dto)
        {
            string? imageUrl = null;
            if (dto.Image != null)
            {
                using (var stream = dto.Image.OpenReadStream()) { imageUrl = await _fileService.UploadAsync(stream, dto.Image.FileName, "banners"); }
            }

            var banner = new Banner
            {
                ImageUrl = imageUrl,
                LinkUrl = dto.LinkUrl,
                DisplayStyle = dto.DisplayStyle,
                IsActive = dto.IsActive,
                CategoryId = dto.CategoryId,
                BrandId = dto.BrandId,
                SortOrder = dto.SortOrder
            };

            var id = await _bannerRepository.CreateAsync(banner);
            banner.Id = id;
            return Ok(new { success = true, data = banner, message = "Banner created successfully." });
        }

        [HttpPut("api/v1/banners/admin/{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromForm] BannerFormDto dto)
        {
            var existing = await _bannerRepository.GetByIdAsync(id);
            if (existing == null) return NotFound(new { success = false, message = "Banner not found" });

            string? imageUrl = existing.ImageUrl;
            if (dto.Image != null)
            {
                if (!string.IsNullOrEmpty(existing.ImageUrl))
                    using (var stream = dto.Image.OpenReadStream()) { imageUrl = await _fileService.ReplaceFileAsync(stream, dto.Image.FileName, existing.ImageUrl, "banners"); }
                else
                    using (var stream = dto.Image.OpenReadStream()) { imageUrl = await _fileService.UploadAsync(stream, dto.Image.FileName, "banners"); }
            }

            existing.ImageUrl = imageUrl;
            existing.LinkUrl = dto.LinkUrl;
            existing.DisplayStyle = dto.DisplayStyle;
            existing.IsActive = dto.IsActive;
            existing.CategoryId = dto.CategoryId;
            existing.BrandId = dto.BrandId;
            existing.SortOrder = dto.SortOrder;

            await _bannerRepository.UpdateAsync(existing);
            return Ok(new { success = true, data = existing, message = "Banner updated successfully." });
        }

        [HttpDelete("api/v1/banners/admin/{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _bannerRepository.GetByIdAsync(id);
            if (existing != null && !string.IsNullOrEmpty(existing.ImageUrl))
            {
                _fileService.DeleteFile(existing.ImageUrl);
            }

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
