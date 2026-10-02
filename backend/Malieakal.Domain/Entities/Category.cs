using System;

namespace Malieakal.Domain.Entities
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public string? SeoTitle { get; set; }
        public string? SeoDescription { get; set; }
        public int DisplayOrder { get; set; }
        public bool ShowInTopNav { get; set; }
        public string SpecificationTemplate { get; set; } = "{}";
        public string HighlightKeys { get; set; } = "[]";
    }
}
