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

        public BrandsController(IBrandRepository brandRepo)
        {
            _brandRepo = brandRepo;
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
        public async Task<IActionResult> Create([FromBody] Brand brand)
        {
            var newId = await _brandRepo.CreateAsync(brand);
            return CreatedAtAction(nameof(GetById), new { id = newId }, new { success = true, data = newId });
        }

        [HttpPut("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] Brand brand)
        {
            brand.Id = id;
            await _brandRepo.UpdateAsync(brand);
            return Ok(new { success = true, data = brand });
        }
    }
}
