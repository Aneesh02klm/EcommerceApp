using Malieakal.Application.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/delivery")]
    public class DeliveryController : ControllerBase
    {
        private readonly IDeliveryEngineService _deliveryEngine;

        public DeliveryController(IDeliveryEngineService deliveryEngine)
        {
            _deliveryEngine = deliveryEngine;
        }

        [HttpGet("check-pincode/{pincode}")]
        public async Task<IActionResult> CheckPincode(string pincode)
        {
            if (string.IsNullOrWhiteSpace(pincode)) return BadRequest();
            var result = await _deliveryEngine.CalculateDeliveryAsync(pincode, "");
            
            return Ok(new { 
                success = true, 
                data = new {
                    isServiceable = result.IsServiceable,
                    estimatedDays = result.EstimatedDays,
                    charge = result.Charge,
                    message = result.Message
                } 
            });
        }

        [HttpPost("calculate")]
        public async Task<IActionResult> CalculateCharge([FromBody] CalculateChargeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Pincode)) return BadRequest();
            var result = await _deliveryEngine.CalculateDeliveryAsync(request.Pincode, request.StateName ?? "");
            
            return Ok(new { 
                success = true, 
                data = new {
                    isServiceable = result.IsServiceable,
                    estimatedDays = result.EstimatedDays,
                    charge = result.Charge,
                    message = result.Message
                } 
            });
        }
    }

    public class CalculateChargeRequest
    {
        public string Pincode { get; set; } = string.Empty;
        public string? StateName { get; set; }
    }
}
