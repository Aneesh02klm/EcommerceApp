using System;

namespace Malieakal.Domain.Entities
{
    public class ProductImage
    {
        public int Id { get; set; }
        public Guid ProductId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
        public int DisplayOrder { get; set; }
    }
}
