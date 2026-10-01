using System;

namespace Malieakal.Domain.Entities
{
    public class ProductSpecification
    {
        public Guid ProductId { get; set; }
        public int SpecificationDefinitionId { get; set; }
        public string Value { get; set; } = string.Empty;
    }
}
