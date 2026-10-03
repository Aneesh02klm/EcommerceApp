using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Malieakal.Domain.Entities;

namespace Malieakal.Application.Abstractions
{
    public interface INotificationRepository
    {
        Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid? userId, string role);
        Task MarkAsReadAsync(int id);
        Task ClearNotificationAsync(int id);
        Task ClearAllAsync(Guid? userId, string role);
        Task AddNotificationAsync(Notification notification);
    }
}
