using System;
using System.Collections.Generic;
using System.Linq;

namespace Malieakal.Domain.Entities
{
    public class CartItem
    {
        public int Id { get; set; }
        public Guid CartId { get; set; }
        public Guid ProductId { get; set; }
        public int? VariantId { get; set; }
        public int Quantity { get; set; }
        
        // Navigation / Hydrated Properties
        public Product? Product { get; set; }
    }

    public class Cart
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<CartItem> Items { get; set; } = new();

        // Calculated fields based on Product pricing logic
        public decimal TotalMRP => Items.Sum(i => (i.Product?.MRP ?? 0) * i.Quantity);
        public decimal TotalDiscount => TotalMRP - FinalTotal; // Absolute discount sum (MRP - FinalPrice)
        public decimal FinalTotal => Items.Sum(i => (i.Product?.FinalPrice ?? 0) * i.Quantity);
        public decimal Savings => TotalDiscount;
    }
}
