using System;

namespace Malieakal.Domain.Entities
{
    public class PromotionItem
    {
        public int Id { get; set; }
        public int FlashSaleId { get; set; } public int CatalogPromotionId { get; set; } // Either FlashSaleId or CatalogPromotionId based on context
        public Guid ProductId { get; set; }
        public string? Sku { get; set; }
        public string? Name { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Mrp { get; set; }
        public string DiscountType { get; set; } = "Percentage";
        public decimal Discount { get; set; }
    }
}
