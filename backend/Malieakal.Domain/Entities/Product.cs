using System;
using System.Collections.Generic;

namespace Malieakal.Domain.Entities
{
    public class Product
    {
        public Guid Id { get; set; }
        public int CategoryId { get; set; }
        public int? SubcategoryId { get; set; }
        public int BrandId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? CategorySlug { get; set; }
        public string? BrandSlug { get; set; }
        public string? SKU { get; set; }
        public string? Model { get; set; }
        public decimal MRP { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalPrice { get; set; }
        public int Stock { get; set; }
        public string? Description { get; set; }
        public string? Features { get; set; }
        public string? Highlights { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string SpecificationJson { get; set; } = "{}";
        public string VariantKeys { get; set; } = "[]";

        public List<ProductImage> Images { get; set; } = new List<ProductImage>();
        public List<ProductSpecification> Specifications { get; set; } = new List<ProductSpecification>();
        public List<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
        public List<ProductRichMedia> RichMedia { get; set; } = new List<ProductRichMedia>();
    }
}
