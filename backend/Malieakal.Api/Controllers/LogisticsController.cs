using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin/logistics")]
    [Authorize(Roles = "Admin")]
    public class LogisticsController : ControllerBase
    {
        private readonly ILogisticsRepository _repo;

        public LogisticsController(ILogisticsRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _repo.GetSettingsAsync();
            return Ok(new { success = true, data = settings });
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] LogisticsSettings settings)
        {
            await _repo.UpdateSettingsAsync(settings);
            return Ok(new { success = true, message = "Logistics settings updated successfully" });
        }

        [HttpGet("states")]
        public async Task<IActionResult> GetStateRules()
        {
            var rules = await _repo.GetAllStateRulesAsync();
            return Ok(new { success = true, data = rules });
        }

        [HttpPost("states")]
        public async Task<IActionResult> UpsertStateRule([FromBody] StateDeliveryRule rule)
        {
            await _repo.UpdateStateRuleAsync(rule);
            return Ok(new { success = true, message = "State delivery rule updated" });
        }

        [HttpDelete("states/{id}")]
        public async Task<IActionResult> DeleteStateRule(int id)
        {
            await _repo.DeleteStateRuleAsync(id);
            return Ok(new { success = true, message = "State rule deleted" });
        }

        [HttpPost("pincodes/bulk")]
        public async Task<IActionResult> BulkUploadPincodes([FromBody] List<ServiceablePincode> pincodes)
        {
            if (pincodes == null || pincodes.Count == 0) return BadRequest("Empty pincodes list");
            await _repo.BulkUpsertPincodesAsync(pincodes);
            return Ok(new { success = true, message = $"{pincodes.Count} pincodes successfully processed" });
        }
    }
}
