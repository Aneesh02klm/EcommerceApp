using System;

namespace Malieakal.Domain.Entities
{
    public class Banner
    {
        public int Id { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
        public string DisplayStyle { get; set; } = "Slider";
        public bool IsActive { get; set; } = true;
        public int? CategoryId { get; set; }
        public int? BrandId { get; set; }
        public int SortOrder { get; set; }
    }
}
