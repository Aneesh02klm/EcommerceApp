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
                "SELECT * FROM CatalogPromotions WHERE IsActive = true AND StartDate <= @Now AND EndDate >= @Now",
                new { Now = System.DateTime.UtcNow })).ToList();

            if (!activePromos.Any()) return;

            foreach (var p in products)
            {
                var promo = activePromos.FirstOrDefault(pr => pr.TargetType == "Brand" && pr.TargetId == p.BrandId)
                         ?? activePromos.FirstOrDefault(pr => pr.TargetType == "Category" && pr.TargetId == p.CategoryId)
                         ?? activePromos.FirstOrDefault(pr => pr.TargetType == "Store");

                if (promo != null)
                {
                    decimal promoDiscount = promo.DiscountType == "Percentage" 
                        ? p.MRP * (promo.DiscountValue / 100m) 
                        : promo.DiscountValue;

                    decimal newFinalPrice = p.MRP - promoDiscount;
                    if (newFinalPrice < p.FinalPrice)
                    {
                        p.FinalPrice = newFinalPrice;
                        p.Discount = promo.DiscountValue;
                    }
                }
            }
        }

        private async Task ApplyCatalogPromotions(Malieakal.Domain.Entities.Product product)
        {
            if (product != null) await ApplyCatalogPromotions(new[] { product });
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

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Malieakal.Application.Models.ProductSearchQuery query)
        {
            var products = await _productRepository.SearchAsync(query);
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
            
            return Ok(new { success = true, data = product });
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var product = await _productRepository.GetBySlugAsync(slug);
            if (product == null) return NotFound(new { success = false, message = "Product not found." });
            
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
