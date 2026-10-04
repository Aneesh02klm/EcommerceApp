using System.Text.Json;
using System.Text.Json.Nodes;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dapper;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductsController : ControllerBase
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

            // C# dynamic mapping is easier
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
                        continue; // Skip fallback
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
                            continue; // Skip fallback
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
            } catch (Exception ex) {
                // Log exception if needed
            }
        }

        private async Task ApplyFlashSales(Malieakal.Domain.Entities.Product product)
        {
            if (product != null) await ApplyFlashSales(new[] { product });
        }

private readonly IProductRepository _productRepository;
        private readonly Malieakal.Application.Abstractions.IDbConnectionFactory _db;
        private readonly IFileService _fileService;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<Malieakal.Api.Hubs.StorefrontHub> _hubContext;

        public ProductsController(IProductRepository productRepository, IFileService fileService, Microsoft.AspNetCore.SignalR.IHubContext<Malieakal.Api.Hubs.StorefrontHub> hubContext, Malieakal.Application.Abstractions.IDbConnectionFactory db)
        {
            _productRepository = productRepository;
            _db = db;
            _fileService = fileService;
            _hubContext = hubContext;
        }

        [HttpGet("test-promos")]
        public async Task<IActionResult> TestPromos() {
            using var connection = _db.CreateConnection();
            var promos = await connection.QueryAsync<dynamic>("SELECT Id, Name, TargetType, TargetId, TargetCategoryId, TargetBrandId, DiscountType, DiscountValue, StartDate, EndDate, IsActive, CreatedAt FROM CatalogPromotions");
            return Ok(promos);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Malieakal.Application.Models.ProductSearchQuery query)
        {
            var products = (await _productRepository.SearchAsync(query)).ToList();
            await ApplyCatalogPromotions(products);
            await ApplyFlashSales(products);
            
            if (query.IsDeal == true) {
                products = products.Where(p => p.AppliedPromotionType == "CATALOG_PROMOTION" || p.AppliedPromotionType == "FLASH_SALE").ToList();
            }
            
            return Ok(new { success = true, data = products });
        }

        [HttpGet("facets")]
        public async Task<IActionResult> GetFacets([FromQuery] Malieakal.Application.Models.ProductSearchQuery query)
        {
            var facets = await _productRepository.GetProductFacetsAsync(query);
            return Ok(new { success = true, data = facets });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return NotFound(new { success = false, message = "Product not found." });
            await ApplyCatalogPromotions(new[] { product });
            await ApplyFlashSales(new[] { product });
            return Ok(new { success = true, data = product });
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var product = await _productRepository.GetBySlugAsync(slug);
            if (product == null) return NotFound(new { success = false, message = "Product not found." });
            await ApplyCatalogPromotions(new[] { product });
            await ApplyFlashSales(new[] { product });
            return Ok(new { success = true, data = product });
        }

        
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] Microsoft.AspNetCore.Http.IFormCollection form)
        {
            var productJson = form["productData"];
            var product = System.Text.Json.JsonSerializer.Deserialize<Malieakal.Domain.Entities.Product>(productJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (product == null) return BadRequest(new { success = false, message = "Invalid payload" });
            
            product.Id = Guid.NewGuid();
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;

            foreach (var file in form.Files)
            {
                if (file.Name.StartsWith("primary_"))
                {
                    int idx = int.Parse(file.Name.Split('_')[1]);
                    string newPath = await _fileService.UploadAsync(file.OpenReadStream(), file.FileName, "products");
                    if (product.Images.Count > idx) {
                        product.Images[idx].ImageUrl = newPath;
                    } else {
                        product.Images.Add(new Malieakal.Domain.Entities.ProductImage { ImageUrl = newPath, IsPrimary = idx == 0, DisplayOrder = idx });
                    }
                }
                else if (file.Name.StartsWith("richMedia_"))
                {
                    int idx = int.Parse(file.Name.Split('_')[1]);
                    string newPath = await _fileService.UploadAsync(file.OpenReadStream(), file.FileName, "products");
                    if (product.RichMedia.Count > idx) {
                        product.RichMedia[idx].MediaUrl = newPath;
                    } else {
                        product.RichMedia.Add(new Malieakal.Domain.Entities.ProductRichMedia { Type = "Image", MediaUrl = newPath, DisplayOrder = idx });
                    }
                }
            }
            
            if (product.Images.Count > 0) product.ImageUrl = product.Images[0].ImageUrl;
            
            await _productRepository.CreateAsync(product);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, new { success = true, data = product });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromForm] Microsoft.AspNetCore.Http.IFormCollection form)
        {
            var existing = await _productRepository.GetByIdAsync(id);
            if (existing == null) return NotFound();

            var productJson = form["productData"];
            var product = System.Text.Json.JsonSerializer.Deserialize<Malieakal.Domain.Entities.Product>(productJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (product == null) return BadRequest(new { success = false, message = "Invalid payload" });

            product.Id = id;
            product.UpdatedAt = DateTime.UtcNow;

            foreach (var file in form.Files)
            {
                if (file.Name.StartsWith("primary_"))
                {
                    int idx = int.Parse(file.Name.Split('_')[1]);
                    var oldPath = product.Images.Count > idx ? product.Images[idx].ImageUrl : null;
                    string newPath;
                    if (!string.IsNullOrEmpty(oldPath) && oldPath.StartsWith("/uploads/")) {
                        newPath = await _fileService.ReplaceFileAsync(file.OpenReadStream(), file.FileName, oldPath, "products");
                    } else {
                        newPath = await _fileService.UploadAsync(file.OpenReadStream(), file.FileName, "products");
                    }
                    if (product.Images.Count > idx) product.Images[idx].ImageUrl = newPath;
                }
                else if (file.Name.StartsWith("richMedia_"))
                {
                    int idx = int.Parse(file.Name.Split('_')[1]);
                    var oldPath = product.RichMedia.Count > idx ? product.RichMedia[idx].MediaUrl : null;
                    string newPath;
                    if (!string.IsNullOrEmpty(oldPath) && oldPath.StartsWith("/uploads/")) {
                        newPath = await _fileService.ReplaceFileAsync(file.OpenReadStream(), file.FileName, oldPath, "products");
                    } else {
                        newPath = await _fileService.UploadAsync(file.OpenReadStream(), file.FileName, "products");
                    }
                    if (product.RichMedia.Count > idx) product.RichMedia[idx].MediaUrl = newPath;
                }
            }

            if (product.Images.Count > 0) product.ImageUrl = product.Images[0].ImageUrl;

            await _productRepository.UpdateAsync(product);
            await _hubContext.Clients.All.SendAsync("ProductUpdated", new { ProductId = product.Id, Price = product.FinalPrice, Stock = product.Stock, IsActive = product.IsActive });
            return Ok(new { success = true, data = product });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var existing = await _productRepository.GetByIdAsync(id);
            if (existing == null) return NotFound();

            if (existing.Images != null) {
                foreach(var img in existing.Images) {
                    if (!string.IsNullOrEmpty(img.ImageUrl) && img.ImageUrl.StartsWith("/uploads/")) {
                        try { _fileService.DeleteFile(img.ImageUrl); } catch {}
                    }
                }
            }
            if (existing.RichMedia != null) {
                foreach(var rm in existing.RichMedia) {
                    if (!string.IsNullOrEmpty(rm.MediaUrl) && rm.MediaUrl.StartsWith("/uploads/")) {
                        try { _fileService.DeleteFile(rm.MediaUrl); } catch {}
                    }
                }
            }

            await _productRepository.DeleteAsync(id);
            return Ok(new { success = true });
        }

    }
}
