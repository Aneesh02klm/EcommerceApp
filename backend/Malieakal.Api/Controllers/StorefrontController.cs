using Microsoft.AspNetCore.SignalR;
using Malieakal.Api.Hubs;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Nodes;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.Collections.Generic;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class StorefrontController : ControllerBase
    {
        private readonly IStorefrontRepository _storefrontRepo;
        private readonly ICategoryRepository _categoryRepo;
        private readonly IBrandRepository _brandRepo;
        private readonly IProductRepository _productRepo;

        private readonly IHubContext<StorefrontHub> _hubContext;

        public StorefrontController(
            IStorefrontRepository storefrontRepo,
            ICategoryRepository categoryRepo,
            IBrandRepository brandRepo,
            IProductRepository productRepo,
            IHubContext<StorefrontHub> hubContext)
        {
            _storefrontRepo = storefrontRepo;
            _categoryRepo = categoryRepo;
            _brandRepo = brandRepo;
            _productRepo = productRepo;
            _hubContext = hubContext;
        }

        [HttpGet("homepage-config")]
        public async Task<IActionResult> GetPublicHomepage([FromQuery] string? mode = null)
        {
            var config = mode == "draft" ? await _storefrontRepo.GetDraftConfigAsync() : await _storefrontRepo.GetPublishedConfigAsync();
            var hydratedNode = await HydrateConfigInternalAsync(config);
            return Ok(new { success = true, data = hydratedNode ?? JsonNode.Parse(config.GetRawText()) });
        }

        private async Task<JsonNode?> HydrateConfigInternalAsync(System.Text.Json.JsonElement config)
        {
            var jsonNode = JsonNode.Parse(config.GetRawText());
            if (jsonNode == null || jsonNode["sections"] == null) return null;

            var sectionsArray = jsonNode["sections"] as JsonArray;
            if (sectionsArray == null) return null;

            var allCategories = await _categoryRepo.GetAllAsync();
            var allBrands = await _brandRepo.GetAllAsync();
            var allProducts = await _productRepo.GetAllAsync();

            foreach (var section in sectionsArray)
            {
                if (section == null) continue;
                
                var typeNode = section["type"]?.ToString();
                
                if (typeNode == "FeaturedCategories")
                {
                    var catIdsNode = section["categoryIds"] as JsonArray;
                    if (catIdsNode != null)
                    {
                        var ids = catIdsNode.Select(n => (int)n).ToList();
                        var selectedCats = allCategories.Where(c => ids.Contains(c.Id)).ToList();
                        section["items"] = JsonSerializer.SerializeToNode(selectedCats, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                    }
                }
                else if (typeNode == "BrandPartners")
                {
                    var brandIdsNode = section["brandIds"] as JsonArray;
                    if (brandIdsNode != null)
                    {
                        var ids = brandIdsNode.Select(n => (int)n).ToList();
                        var selectedBrands = allBrands.Where(b => ids.Contains(b.Id)).ToList();
                        section["items"] = JsonSerializer.SerializeToNode(selectedBrands, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                    }
                }
                else if (typeNode == "ProductGrid")
                {
                    var queryType = section["queryType"]?.ToString() ?? "Manual";
                    var maxItemsStr = section["maxItems"]?.ToString();
                    int maxItems = 4;
                    if (!string.IsNullOrEmpty(maxItemsStr) && int.TryParse(maxItemsStr, out int m)) maxItems = m;
                    
                    if (queryType == "NewArrivals")
                    {
                        var items = allProducts.OrderByDescending(p => p.CreatedAt).Take(maxItems).ToList();
                        section["items"] = JsonSerializer.SerializeToNode(items, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                    }
                    else if (queryType == "BestSellers")
                    {
                        var items = allProducts.OrderByDescending(p => p.SoldStock).ThenByDescending(p => p.CreatedAt).Take(maxItems).ToList();
                        section["items"] = JsonSerializer.SerializeToNode(items, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                    }
                    else if (queryType == "LightningDeals")
                    {
                        var items = allProducts.Where(p => p.Discount > 0).OrderByDescending(p => p.Discount).Take(maxItems).ToList();
                        section["items"] = JsonSerializer.SerializeToNode(items, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                    }
                    else
                    {
                        var pIdsNode = section["productIds"] as JsonArray;
                        if (pIdsNode != null)
                        {
                            var idStrs = pIdsNode.Select(n => n?.ToString()).Where(s => !string.IsNullOrEmpty(s)).ToList();
                            var ids = idStrs.Select(s => Guid.Parse(s!)).ToList();
                            var selectedProducts = allProducts.Where(p => ids.Contains(p.Id)).ToList();
                            section["items"] = JsonSerializer.SerializeToNode(selectedProducts, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                        }
                    }
                }
            }
            return jsonNode;
        }

        [HttpGet("admin/config")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminConfig()
        {
            var config = await _storefrontRepo.GetDraftConfigAsync();
            return Ok(new { success = true, data = config });
        }

        [HttpPut("admin/config")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAdminConfig([FromBody] JsonElement configJson)
        {
            await _storefrontRepo.UpdateDraftConfigAsync(configJson);
            return Ok(new { success = true });
        }

        
        [HttpPost("admin/publish")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> PublishConfig()
        {
            await _storefrontRepo.PublishConfigAsync();
            var newConfig = await _storefrontRepo.GetPublishedConfigAsync();
            var hydratedNode = await HydrateConfigInternalAsync(newConfig);
            
            await _hubContext.Clients.All.SendAsync("ReceiveLayoutUpdate", hydratedNode ?? JsonNode.Parse(newConfig.GetRawText()));
            return Ok(new { success = true });
        }

        [HttpPost("pre-booking")]
        public async Task<IActionResult> SubmitPreBooking([FromBody] PreBookingEnquiry enquiry)
        {
            if (string.IsNullOrEmpty(enquiry.FullName) || string.IsNullOrEmpty(enquiry.ContactNumber))
                return BadRequest(new { success = false, message = "Name and Contact Number are required." });
                
            enquiry.Status = "Pending";
            var id = await _storefrontRepo.CreatePreBookingAsync(enquiry);
            return Ok(new { success = true, data = id, message = "Pre-booking enquiry submitted successfully. Our team will contact you soon." });
        }

        [HttpGet("admin/pre-bookings")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPreBookings()
        {
            var data = await _storefrontRepo.GetPreBookingsAsync();
            return Ok(new { success = true, data });
        }

        [HttpPatch("admin/pre-bookings/{id}/status")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePreBookingStatus(int id, [FromBody] JsonElement payload)
        {
            if (payload.TryGetProperty("status", out var statusProp))
            {
                await _storefrontRepo.UpdatePreBookingStatusAsync(id, statusProp.GetString()!);
                return Ok(new { success = true });
            }
            return BadRequest();
        }
    }
}
