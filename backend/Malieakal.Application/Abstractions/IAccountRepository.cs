using System;
using System.Threading.Tasks;
using Malieakal.Application.Models;

namespace Malieakal.Application.Abstractions
{
    public interface IAccountRepository
    {
        Task<AccountDashboardDto> GetDashboardAsync(Guid userId);
        Task<object> GetAddressesAsync(Guid userId);
        Task<object> GetCouponsAsync(Guid userId);
        Task<object> GetRewardsAsync(Guid userId);
        Task<object> GetWarrantiesAsync(Guid userId);
        Task<object> GetComplaintsAsync(Guid userId);
        Task<object> GetNotificationsAsync(Guid userId);
        Task<object> GetSettingsAsync(Guid userId);
        Task<object> GetPaymentMethodsAsync(Guid userId);
    }
}
