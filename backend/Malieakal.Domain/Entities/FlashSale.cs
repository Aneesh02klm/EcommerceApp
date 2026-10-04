using System;

namespace Malieakal.Domain.Entities
{
    public class FlashSale
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsActive { get; set; } = true;
        public decimal DiscountValue { get; set; }
        public string TargetType { get; set; } = "Product";
        public int? TargetBrandId { get; set; }
        public System.Collections.Generic.List<SpecificProductDto> SpecificProducts { get; set; } = new();
        public int? TargetCategoryId { get; set; }
    }
}
