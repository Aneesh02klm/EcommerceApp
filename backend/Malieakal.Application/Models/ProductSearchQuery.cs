using System.Collections.Generic;

namespace Malieakal.Application.Models
{
    public class ProductSearchQuery
    {
        public string? Keyword { get; set; }
        public int? CategoryId { get; set; }
        public int? BrandId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? SortBy { get; set; } // PriceAsc, PriceDesc, Newest
        public Dictionary<int, string>? SpecFilters { get; set; } 
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 100;
    }
}
