using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepo;
        private readonly ISpecificationRepository _specRepo;

        public CategoriesController(ICategoryRepository categoryRepo, ISpecificationRepository specRepo)
        {
            _categoryRepo = categoryRepo;
            _specRepo = specRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _categoryRepo.GetAllAsync();
            return Ok(new { success = true, data = categories });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryRepo.GetByIdAsync(id);
            if (category == null) return NotFound(new { success = false, message = "Category not found." });
            return Ok(new { success = true, data = category });
        }

        [HttpGet("{id}/specifications")]
        public async Task<IActionResult> GetCategorySpecifications(int id)
        {
            var specs = await _specRepo.GetByCategoryIdAsync(id);
            return Ok(new { success = true, data = specs });
        }
        
        [HttpPost]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] Category category)
        {
            var newId = await _categoryRepo.CreateAsync(category);
            return CreatedAtAction(nameof(GetById), new { id = newId }, new { success = true, data = newId });
        }
        
        [HttpPut("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] Category category)
        {
            category.Id = id;
            await _categoryRepo.UpdateAsync(category);
            return Ok(new { success = true, data = category });
        }

        [HttpDelete("{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _categoryRepo.DeleteAsync(id);
            return Ok(new { success = true, message = "Category deleted successfully." });
        }
    }
}
