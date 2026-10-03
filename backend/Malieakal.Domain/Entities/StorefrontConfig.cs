using System.Text.Json;

namespace Malieakal.Domain.Entities
{
    public class StorefrontConfig
    {
        public int Id { get; set; }
        public JsonElement DraftJson { get; set; }
        public JsonElement PublishedJson { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class PreBookingEnquiry
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? VariantOfInterest { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
    }
}
