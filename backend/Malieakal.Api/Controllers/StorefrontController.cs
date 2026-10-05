using Microsoft.AspNetCore.SignalR;
using Malieakal.Api.Hubs;
using Microsoft.AspNetCore.Mvc;
using Dapper;
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
                private async Task ApplyCatalogPromotions(IEnumerable<Malieakal.Domain.Entities.Product> products)
        {
            if (products == null || !products.Any()) return;
            using var connection = _db.CreateConnection();
            var activePromos = (await connection.QueryAsync<Malieakal.Domain.Entities.CatalogPromotion>(
                "SELECT Id, Name, TargetType, TargetId, TargetCategoryId, TargetBrandId, DiscountType, DiscountValue, StartDate, EndDate, IsActive, CreatedAt FROM CatalogPromotions WHERE IsActive = true AND StartDate <= @Now AND EndDate >= @Now",
                new { Now = System.DateTime.UtcNow })).ToList();

            if (!activePromos.Any()) return;

            var promoIds = activePromos.Select(p => p.Id).ToList();
            var itemsSql = "SELECT ProductId as Id, Sku, Name, ImageUrl, Mrp, DiscountType, Discount, CatalogPromotionId FROM CatalogPromotionItems WHERE CatalogPromotionId = ANY(@Ids)";
            var allItems = await connection.QueryAsync<dynamic>(itemsSql, new { Ids = promoIds });

            foreach (var promo in activePromos) {
                promo.SpecificProducts = allItems.Where(i => i.catalogpromotionid == promo.Id).Select(i => new Malieakal.Domain.Entities.SpecificProductDto {
                    Id = i.id,
                    DiscountType = i.discounttype,
                    Discount = i.discount
                }).ToList();
            }

            foreach (var p in products)
            {
                // First check SpecificProducts
                var specificPromo = activePromos.FirstOrDefault(pr => pr.TargetType == "SpecificProducts" && pr.SpecificProducts != null && pr.SpecificProducts.Any(i => i.Id == p.Id));
                
                if (specificPromo != null)
                {
                    var item = specificPromo.SpecificProducts.FirstOrDefault(i => i.Id == p.Id);
                    if (item != null) {
                        decimal discountVal = item.Discount;
                        string dtype = item.DiscountType?.ToLower() ?? "percentage";
                        
                        if (dtype == "fixed" || dtype == "flat") {
                            p.FinalPrice = p.MRP - discountVal;
                            p.Discount = discountVal;
                        } else {
                            p.FinalPrice = p.MRP - (p.MRP * (discountVal / 100m));
                            p.Discount = discountVal;
                        }
                        p.AppliedPromotionType = "CATALOG_PROMOTION";
                        continue;
                    }
                }

                // Fallback to Category/Brand/Store
                var promo = activePromos.FirstOrDefault(pr => pr.TargetType == "Category" && pr.TargetCategoryId == p.CategoryId && pr.TargetBrandId == p.BrandId)
                         ?? activePromos.FirstOrDefault(pr => pr.TargetType == "Brand" && pr.TargetBrandId == p.BrandId)
                         ?? activePromos.FirstOrDefault(pr => pr.TargetType == "Category" && pr.TargetCategoryId == p.CategoryId && pr.TargetBrandId == null)
                         ?? activePromos.FirstOrDefault(pr => pr.TargetType == "Store" || (pr.TargetType == "Category" && pr.TargetCategoryId == null && pr.TargetBrandId == p.BrandId));

                if (promo != null)
                {
                    decimal promoDiscount = promo.DiscountType == "Percentage" 
                        ? p.MRP * (promo.DiscountValue / 100m) 
                        : promo.DiscountValue;

                    p.FinalPrice = p.MRP - promoDiscount;
                    p.Discount = promo.DiscountValue;
                    p.AppliedPromotionType = "CATALOG_PROMOTION";
                }
            }
        }

        private async Task ApplyCatalogPromotions(Malieakal.Domain.Entities.Product product)
        {
            if (product != null) await ApplyCatalogPromotions(new[] { product });
        }

        private async Task ApplyFlashSales(IEnumerable<Malieakal.Domain.Entities.Product> products)
        {
            if (products == null || !products.Any()) return;
            try {
                using var connection = _db.CreateConnection();
                var activeFlashSales = (await connection.QueryAsync<Malieakal.Domain.Entities.FlashSale>(
                    @"SELECT Id, Title, StartTime, EndTime, IsActive, DiscountValue, TargetType, TargetCategoryId, TargetBrandId FROM FlashSales 
                      WHERE IsActive = true 
                        AND (NOW() AT TIME ZONE 'UTC') BETWEEN StartTime AND EndTime")).ToList();

                if (!activeFlashSales.Any()) return;

                var saleIds = activeFlashSales.Select(s => s.Id).ToList();
                var itemsSql = "SELECT ProductId as Id, Sku, Name, ImageUrl, Mrp, DiscountType, Discount, FlashSaleId FROM FlashSaleItems WHERE FlashSaleId = ANY(@Ids)";
                var allItems = await connection.QueryAsync<dynamic>(itemsSql, new { Ids = saleIds });

                foreach (var sale in activeFlashSales) {
                    sale.SpecificProducts = allItems.Where(i => i.flashsaleid == sale.Id).Select(i => new Malieakal.Domain.Entities.SpecificProductDto {
                        Id = i.id,
                        DiscountType = i.discounttype,
                        Discount = i.discount
                    }).ToList();
                }

                foreach (var p in products)
                {
                    // Specific Products
                    var specificSale = activeFlashSales.FirstOrDefault(fs => fs.TargetType == "SpecificProducts" && fs.SpecificProducts != null && fs.SpecificProducts.Any(i => i.Id == p.Id));
                    if (specificSale != null)
                    {
                        var item = specificSale.SpecificProducts.FirstOrDefault(i => i.Id == p.Id);
                        if (item != null) {
                            decimal discountVal = item.Discount;
                            string dtype = item.DiscountType?.ToLower() ?? "percentage";
                            
                            if (dtype == "fixed" || dtype == "flat") {
                                p.FinalPrice = p.MRP - discountVal;
                                p.Discount = discountVal;
                            } else {
                                p.FinalPrice = p.MRP - (p.MRP * (discountVal / 100m));
                                p.Discount = discountVal;
                            }
                            
                            p.FlashSaleName = specificSale.Title;
                            p.FlashSaleEndTime = specificSale.EndTime;
                            continue;
                        }
                    }

                    var sale = activeFlashSales.FirstOrDefault(fs => 
                        fs.TargetType == "Store" || 
                        fs.TargetType == "Brand" && fs.TargetBrandId == p.BrandId ||
                        (fs.TargetType == "Category" && fs.TargetCategoryId == p.CategoryId) || (fs.TargetCategoryId == 0) ||
                        (fs.TargetCategoryId == p.CategoryId && p.CategoryId != null));

                    if (sale != null)
                    {
                        p.FinalPrice = p.MRP - (p.MRP * (sale.DiscountValue / 100m));
                        p.FlashSaleName = sale.Title;
                        p.FlashSaleEndTime = sale.EndTime;
                    }
                }
            } catch { }
        }

        private async Task ApplyFlashSales(Malieakal.Domain.Entities.Product product)
        {
            if (product != null) await ApplyFlashSales(new[] { product });
        }

private readonly IStorefrontRepository _storefrontRepo;
        private readonly ICategoryRepository _categoryRepo;
        private readonly IBrandRepository _brandRepo;
        private readonly IProductRepository _productRepo;
        private readonly Malieakal.Application.Abstractions.IDbConnectionFactory _db;

        private readonly IHubContext<StorefrontHub> _hubContext;

        public StorefrontController(
            IStorefrontRepository storefrontRepo,
            ICategoryRepository categoryRepo,
            IBrandRepository brandRepo,
            IProductRepository productRepo,
            IHubContext<StorefrontHub> hubContext, Malieakal.Application.Abstractions.IDbConnectionFactory db)
        {
            _storefrontRepo = storefrontRepo;
            _categoryRepo = categoryRepo;
            _brandRepo = brandRepo;
            _productRepo = productRepo;
            _db = db;
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
            var allProducts = (await _productRepo.GetAllAsync()).ToList();
            await ApplyCatalogPromotions(allProducts);

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
                        DateTime dateThreshold = DateTime.UtcNow.AddDays(-45);
                        var dateStr = section["newArrivalsDate"]?.ToString();
                        if (!string.IsNullOrEmpty(dateStr) && DateTime.TryParse(dateStr, out DateTime d)) dateThreshold = d;

                        var items = allProducts.Where(p => p.CreatedAt >= dateThreshold)
                                               .OrderByDescending(p => p.CreatedAt)
                                               .Take(maxItems).ToList();
                        
                        section["items"] = JsonSerializer.SerializeToNode(items, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                    }
                    else if (queryType == "BestSellers")
                    {
                        var logic = section["bestSellerLogic"]?.ToString() ?? "Hybrid";
                        int threshold = 50;
                        if (int.TryParse(section["minSalesThreshold"]?.ToString(), out int t)) threshold = t;

                        IEnumerable<Malieakal.Domain.Entities.Product> query = allProducts;
                        
                        if (logic == "Manual Only")
                        {
                            query = allProducts.Where(p => p.IsBestSeller);
                        }
                        else if (logic == "Automated by Sales")
                        {
                            query = allProducts.Where(p => p.SoldStock >= threshold);
                        }
                        else // Hybrid
                        {
                            query = allProducts.Where(p => p.IsBestSeller || p.SoldStock >= threshold);
                        }

                        var items = query.OrderByDescending(p => p.SoldStock).ThenByDescending(p => p.CreatedAt).Take(maxItems).ToList();
                        section["items"] = JsonSerializer.SerializeToNode(items, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                    }
                    else if (queryType == "LightningDeals")
                    {
                        var affectedItems = allProducts.Where(p => p.AppliedPromotionType == "CATALOG_PROMOTION").ToList();
                        
                        var items = affectedItems.OrderByDescending(p => p.CreatedAt).Take(maxItems).ToList();
                        section["items"] = JsonSerializer.SerializeToNode(items, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                        section["hasMore"] = affectedItems.Count > maxItems;
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
