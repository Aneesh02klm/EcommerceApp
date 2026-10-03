using Malieakal.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IOrderRepository
    {
        Task<Guid> CreateOrderAsync(Order order, Payment payment);
        Task<Order?> GetOrderByIdAsync(Guid orderId);
        Task<IEnumerable<Order>> GetOrdersByUserIdAsync(Guid userId);
        Task<IEnumerable<Order>> GetAllOrdersAsync();
        Task UpdatePaymentStatusAsync(Guid orderId, string paymentId, string signature, string status);
        Task UpdateOrderStatusAsync(Guid orderId, string status);
        Task AddStatusHistoryAsync(Guid orderId, string status, string? comments = null);
        Task UpdateOrderTrackingAsync(Guid orderId, string? deliveryMethod, string? courierName, string? trackingId, string? trackingUrl);
        Task<bool> LinkGuestOrderToUserAsync(Guid orderId, Guid userId, string email);

        // Address management
        Task<int> CreateAddressAsync(Address address);
        Task<IEnumerable<Address>> GetAddressesByUserIdAsync(Guid userId);
        Task<Address?> GetAddressByIdAsync(int addressId, Guid userId); // IDOR-safe get single
        Task UpdateAddressAsync(Address address, Guid userId);           // IDOR-safe update
        Task<bool> DeleteAddressAsync(int addressId, Guid userId);       // IDOR-safe delete
        Task SetDefaultAddressAsync(int addressId, Guid userId);         // set as default
    }
}
