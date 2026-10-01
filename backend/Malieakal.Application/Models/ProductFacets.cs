using System.Collections.Generic;

namespace Malieakal.Application.Models
{
    public class ProductFacets
    {
        public PriceRangeFacet PriceRange { get; set; } = new();
        public List<BrandFacet> Brands { get; set; } = new();
        public List<SpecFacet> Specs { get; set; } = new();
    }

    public class PriceRangeFacet
    {
        public decimal Min { get; set; }
        public decimal Max { get; set; }
    }

    public class BrandFacet
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class SpecFacet
    {
        public int SpecId { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<SpecValueFacet> Values { get; set; } = new();
    }

    public class SpecValueFacet
    {
        public string Value { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
