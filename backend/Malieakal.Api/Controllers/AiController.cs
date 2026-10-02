using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin/ai")]
    [Authorize(Roles = "Admin")]
    public class AiController : ControllerBase
    {
        public class GenerateProductRequest
        {
            public string Prompt { get; set; }
        }

        [HttpPost("generate-product")]
        public async Task<IActionResult> GenerateProduct([FromBody] GenerateProductRequest req)
        {
            // MOCK GEMINI INTEGRATION
            // In a real scenario, this would call Google.GenerativeAI endpoint with req.Prompt.
            // Since we don't have an active API key or the NuGet package, we simulate the Gemini JSON response.
            
            await Task.Delay(1500); // Simulate Gemini API Latency
            
            var prompt = req.Prompt?.ToLower() ?? "";
            
            var generatedData = new
            {
                description = $"The {req.Prompt} is an advanced flagship electronic device featuring cutting-edge specifications, built for maximum performance and reliability.",
                specifications = new Dictionary<string, string>
                {
                    { "RAM", prompt.Contains("pro") || prompt.Contains("ultra") ? "12GB LPDDR5" : "8GB LPDDR5" },
                    { "Storage", prompt.Contains("256") ? "256GB NVMe" : (prompt.Contains("512") ? "512GB NVMe" : "128GB NVMe") },
                    { "Processor", prompt.Contains("iphone") ? "A17 Pro Bionic" : "Snapdragon 8 Gen 3" },
                    { "Display", "6.7-inch OLED, 120Hz Refresh Rate" },
                    { "Battery", "4500 mAh with Fast Charging" },
                    { "Camera", "48MP Primary, 12MP Ultra-wide, 12MP Telephoto" },
                    { "OS", prompt.Contains("iphone") ? "iOS 17" : "Android 14" }
                },
                mrp = prompt.Contains("pro") ? 134900 : 79900,
                price = prompt.Contains("pro") ? 129900 : 74900,
                model = req.Prompt,
                sku = $"SKU-{System.Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}"
            };

            return Ok(new { success = true, data = generatedData });
        }
    }
}
