using Malieakal.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationsController(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        private (Guid? userId, string role) GetUserContext()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = userIdString != null ? (Guid?)Guid.Parse(userIdString) : null;
            var role = User.IsInRole("Admin") ? "Admin" : "Customer";
            
            if (role == "Admin") userId = null; // Admins share global admin notifications
            
            return (userId, role);
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var (userId, role) = GetUserContext();
            var notifications = await _notificationRepository.GetUserNotificationsAsync(userId, role);
            return Ok(new { success = true, data = notifications });
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            await _notificationRepository.MarkAsReadAsync(id);
            return Ok(new { success = true });
        }

        [HttpPatch("{id}/clear")]
        public async Task<IActionResult> ClearNotification(int id)
        {
            await _notificationRepository.ClearNotificationAsync(id);
            return Ok(new { success = true });
        }

        [HttpPatch("clear-all")]
        public async Task<IActionResult> ClearAll()
        {
            var (userId, role) = GetUserContext();
            await _notificationRepository.ClearAllAsync(userId, role);
            return Ok(new { success = true });
        }
    }
}
