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

        [HttpGet("groups")]
        public async Task<IActionResult> GetGroups()
        {
            var data = await _specRepo.GetGroupsAsync();
            return Ok(new { success = true, data });
        }

        [HttpPost("groups")]
        public async Task<IActionResult> CreateGroup([FromBody] SpecificationGroup group)
        {
            if (string.IsNullOrWhiteSpace(group.Name)) return BadRequest(new { success = false, message = "Name is required" });
            var newId = await _specRepo.CreateGroupAsync(group);
            group.Id = newId;
            return Ok(new { success = true, data = group, message = "Group created" });
        }

        [HttpPut("groups/{id}")]
        public async Task<IActionResult> UpdateGroup(int id, [FromBody] SpecificationGroup group)
        {
            if (string.IsNullOrWhiteSpace(group.Name)) return BadRequest(new { success = false, message = "Name is required" });
            group.Id = id;
            await _specRepo.UpdateGroupAsync(group);
            return Ok(new { success = true, data = group, message = "Group updated" });
        }

        [HttpDelete("groups/{id}")]
        public async Task<IActionResult> DeleteGroup(int id)
        {
            var inUse = await _specRepo.IsGroupInUseAsync(id);
            if (inUse) return BadRequest(new { success = false, message = "Cannot delete this group because it is currently mapped to existing attributes or categories." });
            
            await _specRepo.DeleteGroupAsync(id);
            return Ok(new { success = true, message = "Group deleted successfully" });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _specRepo.GetAllAsync();
            return Ok(new { success = true, data });
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
