using System;

namespace Malieakal.Domain.Entities
{
    public class ProductRichMedia
    {
        public int Id { get; set; }
        public Guid ProductId { get; set; }
        public string Type { get; set; } = "Image";
        public string MediaUrl { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
    }
}
