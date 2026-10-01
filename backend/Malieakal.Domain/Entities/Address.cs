using System;

namespace Malieakal.Domain.Entities
{
    public class Address
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string AddressType { get; set; } = "Home"; // Home, Work, Other
        public string? FlatHouseNo { get; set; } // Flat, House no., Building, Company, Apartment
        public string? AreaStreet { get; set; } // Area, Street, Sector, Village
        public string AddressLine1 { get; set; } = string.Empty; // kept for backward compat
        public string? AddressLine2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;

        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
