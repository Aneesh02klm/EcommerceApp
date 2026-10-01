using System;

namespace Malieakal.Domain.Entities
{
    public class LogisticsSettings
    {
        public int Id { get; set; } = 1;
        public decimal StoreLat { get; set; }
        public decimal StoreLng { get; set; }
        public decimal FreeDeliveryRadiusKm { get; set; }
        public decimal ChargePerKm { get; set; }
        public decimal BaseFlatRate { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class StateDeliveryRule
    {
        public int Id { get; set; }
        public string StateName { get; set; } = string.Empty;
        public decimal FlatCharge { get; set; }
        public bool IsServiceable { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ServiceablePincode
    {
        public string Pincode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string StateName { get; set; } = string.Empty;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string EstimatedDeliveryDays { get; set; } = string.Empty;
        public bool IsServiceable { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
