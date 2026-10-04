using System;
using System.Collections.Generic;

namespace Malieakal.Domain.Entities
{
    public class SpecificProductDto
    {
        public Guid Id { get; set; } // Maps to ProductId
        public string? Sku { get; set; }
        public string? Name { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Mrp { get; set; }
        public string DiscountType { get; set; } = "Percentage";
        public decimal Discount { get; set; }
    }
}
