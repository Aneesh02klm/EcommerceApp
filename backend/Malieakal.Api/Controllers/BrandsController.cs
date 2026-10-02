using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class BrandsController : ControllerBase
    {
        private readonly IBrandRepository _brandRepo;
        private readonly IFileService _fileService;

        public BrandsController(IBrandRepository brandRepo, IFileService fileService)
        {
            _brandRepo = brandRepo;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var brands = await _brandRepo.GetAllAsync();
            return Ok(new { success = true, data = brands });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var brand = await _brandRepo.GetByIdAsync(id);
            if (brand == null) return NotFound(new { success = false, message = "Brand not found." });
            return Ok(new { success = true, data = brand });
        }

        [HttpPost]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] Microsoft.AspNetCore.Http.IFormCollection form)
        {
            var brandJson = form["brandData"];
            var brand = System.Text.Json.JsonSerializer.Deserialize<Brand>(brandJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (brand == null) return BadRequest(new { success = false, message = "Invalid payload" });

            if (form.Files.Count > 0)
            {
                var file = form.Files[0];
                brand.LogoUrl = await _fileService.UploadAsync(file.OpenReadStream(), file.FileName, "brands");
            }

            var newId = await _brandRepo.CreateAsync(brand);
            return CreatedAtAction(nameof(GetById), new { id = newId }, new { success = true, data = newId });
        }

        [HttpPut("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] Microsoft.AspNetCore.Http.IFormCollection form)
        {
            var existing = await _brandRepo.GetByIdAsync(id);
            if (existing == null) return NotFound();

            var brandJson = form["brandData"];
            var brand = System.Text.Json.JsonSerializer.Deserialize<Brand>(brandJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (brand == null) return BadRequest(new { success = false, message = "Invalid payload" });

            brand.Id = id;
            brand.LogoUrl = existing.LogoUrl; // Default to existing

            if (form.Files.Count > 0)
            {
                var file = form.Files[0];
                if (!string.IsNullOrEmpty(existing.LogoUrl) && existing.LogoUrl.StartsWith("/uploads/"))
                {
                    brand.LogoUrl = await _fileService.ReplaceFileAsync(file.OpenReadStream(), file.FileName, existing.LogoUrl, "brands");
                }
                else
                {
                    brand.LogoUrl = await _fileService.UploadAsync(file.OpenReadStream(), file.FileName, "brands");
                }
            }

            await _brandRepo.UpdateAsync(brand);
            return Ok(new { success = true, data = brand });
        }

        [HttpDelete("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _brandRepo.GetByIdAsync(id);
            if (existing == null) return NotFound();

            if (!string.IsNullOrEmpty(existing.LogoUrl) && existing.LogoUrl.StartsWith("/uploads/"))
            {
                try { _fileService.DeleteFile(existing.LogoUrl); } catch { }
            }

            await _brandRepo.DeleteAsync(id);
            return Ok(new { success = true });
        }
    }
}
