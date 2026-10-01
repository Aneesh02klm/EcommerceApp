using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface ILogisticsRepository
    {
        Task<LogisticsSettings> GetSettingsAsync();
        Task UpdateSettingsAsync(LogisticsSettings settings);
        
        Task<IEnumerable<StateDeliveryRule>> GetAllStateRulesAsync();
        Task<StateDeliveryRule?> GetStateRuleAsync(string stateName);
        Task UpdateStateRuleAsync(StateDeliveryRule rule);
        Task DeleteStateRuleAsync(int id);
        
        Task<ServiceablePincode?> GetPincodeAsync(string pincode);
        Task UpsertPincodeAsync(ServiceablePincode pincode);
        Task BulkUpsertPincodesAsync(IEnumerable<ServiceablePincode> pincodes);
        Task DeletePincodeAsync(string pincode);
    }
}
