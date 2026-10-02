using System;

namespace Malieakal.Domain.Entities
{
    public class SpecificationDefinition
    {
        public int Id { get; set; }
        public int? CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public string? Unit { get; set; }
        public string? AllowedValues { get; set; }
        public bool IsFilterable { get; set; }
        public bool IsSearchable { get; set; }
        public bool IsComparable { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public string GroupName { get; set; } = "General";
    }
}
