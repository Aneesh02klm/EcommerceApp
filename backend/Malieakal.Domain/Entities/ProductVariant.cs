using System;

namespace Malieakal.Domain.Entities
{
    public class ProductVariant
    {
        public int Id { get; set; }
        public Guid ProductId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string OptionName { get; set; } = string.Empty;
        public Guid? LinkedProductId { get; set; }
        // Joined properties for frontend usage
        public string? LinkedProductSlug { get; set; }
        public string? LinkedProductImageUrl { get; set; }
    }
}
