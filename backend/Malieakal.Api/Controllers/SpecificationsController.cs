using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SpecificationsController : ControllerBase
    {
        private readonly ISpecificationRepository _specRepo;

        public SpecificationsController(ISpecificationRepository specRepo)
        {
            _specRepo = specRepo;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SpecificationDefinition spec)
        {
            var newId = await _specRepo.CreateAsync(spec);
            return Ok(new { success = true, data = newId });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SpecificationDefinition spec)
        {
            spec.Id = id;
            await _specRepo.UpdateAsync(spec);
            return Ok(new { success = true, data = spec });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _specRepo.DeleteAsync(id);
            return Ok(new { success = true, message = "Specification deleted successfully." });
        }
    }
}
