using System;

namespace Malieakal.Domain.Entities
{
    public class CatalogPromotion
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty; // Store, Category, Brand
        public int? TargetId { get; set; }
        public int? TargetCategoryId { get; set; }
        public int? TargetBrandId { get; set; }
        public System.Collections.Generic.List<SpecificProductDto>? SpecificProducts { get; set; } = new();
        public string DiscountType { get; set; } = string.Empty; // Percentage, Flat
        public decimal DiscountValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
