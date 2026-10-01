using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Malieakal.Application.Services
{
    public interface IDeliveryEngineService
    {
        Task<(bool IsServiceable, string EstimatedDays, decimal Charge, string Message)> CalculateDeliveryAsync(string pincode, string stateName);
    }

    public class DeliveryEngineService : IDeliveryEngineService
    {
        private readonly ILogisticsRepository _logisticsRepo;

        public DeliveryEngineService(ILogisticsRepository logisticsRepo)
        {
            _logisticsRepo = logisticsRepo;
        }

        public async Task<(bool IsServiceable, string EstimatedDays, decimal Charge, string Message)> CalculateDeliveryAsync(string pincode, string stateName)
        {
            var settings = await _logisticsRepo.GetSettingsAsync();
            var pinRecord = await _logisticsRepo.GetPincodeAsync(pincode);
            
            if (pinRecord != null)
            {
                if (!pinRecord.IsServiceable)
                    return (false, "", 0, "Delivery is not available to this pincode.");
                
                decimal charge = settings.BaseFlatRate;
                
                // If we have lat/lng, calculate Haversine distance
                if (pinRecord.Latitude.HasValue && pinRecord.Longitude.HasValue)
                {
                    var distanceKm = CalculateDistance(
                        (double)settings.StoreLat, (double)settings.StoreLng, 
                        (double)pinRecord.Latitude.Value, (double)pinRecord.Longitude.Value);

                    if (distanceKm <= (double)settings.FreeDeliveryRadiusKm)
                    {
                        charge = 0;
                    }
                    else
                    {
                        var extraKm = distanceKm - (double)settings.FreeDeliveryRadiusKm;
                        charge = (decimal)extraKm * settings.ChargePerKm;
                    }
                }
                else
                {
                    // Fallback to state rule if lat/lng is missing
                    var stateRule = await _logisticsRepo.GetStateRuleAsync(pinRecord.StateName);
                    if (stateRule != null) charge = stateRule.FlatCharge;
                }

                return (true, pinRecord.EstimatedDeliveryDays, Math.Round(charge, 2), "Deliverable");
            }

            // Pincode not found explicitly, check state rule fallback
            if (!string.IsNullOrWhiteSpace(stateName))
            {
                var stateRule = await _logisticsRepo.GetStateRuleAsync(stateName);
                if (stateRule != null)
                {
                    if (!stateRule.IsServiceable)
                        return (false, "", 0, $"Delivery is not available in {stateName}.");
                        
                    return (true, "5-7 Days", stateRule.FlatCharge, "Deliverable");
                }
            }

            // Ultimate fallback
            return (true, "Standard Delivery", settings.BaseFlatRate, "Deliverable");
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371; // km
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double ToRadians(double angle) => Math.PI * angle / 180.0;
    }
}
