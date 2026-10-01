using System;

namespace Malieakal.Domain.Entities
{
    public class ProductVariant
    {
        public int Id { get; set; }
        public Guid ProductId { get; set; }
        public string? SKU { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? AttributesJSON { get; set; }
        public decimal MRP { get; set; }
        public decimal FinalPrice { get; set; }
        public int Stock { get; set; }
        public string? ImageUrl { get; set; }
    }
}
