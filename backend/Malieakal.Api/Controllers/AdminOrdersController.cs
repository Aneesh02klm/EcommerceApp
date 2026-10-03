using Malieakal.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin/orders")]
    [Authorize(Roles = "Admin")]
    public class AdminOrdersController : ControllerBase
    {
        private readonly IOrderRepository _orderRepository;

        
        private readonly INotificationRepository _notificationRepository;

        public AdminOrdersController(IOrderRepository orderRepository, INotificationRepository notificationRepository)
        {
            _orderRepository = orderRepository;
            _notificationRepository = notificationRepository;
        }


        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderRepository.GetAllOrdersAsync();
            return Ok(new { success = true, data = orders });
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(Guid id)
        {
            var order = await _orderRepository.GetOrderByIdAsync(id);
            if (order == null) return NotFound(new { success = false, message = "Order not found." });
            return Ok(new { success = true, data = order });
        }

        
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
        {
            await _orderRepository.UpdateOrderStatusAsync(id, request.Status);
            await _orderRepository.AddStatusHistoryAsync(id, request.Status, "Status updated by admin.");
            
            var order = await _orderRepository.GetOrderByIdAsync(id);
            if (order != null && order.UserId.HasValue)
            {
                await _notificationRepository.AddNotificationAsync(new Malieakal.Domain.Entities.Notification
                {
                    UserId = order.UserId,
                    Role = "Customer",
                    Title = "Order " + request.Status,
                    Message = "Your order " + order.OrderNumber + " is now " + request.Status + ".",
                    LinkUrl = "/account/orders/" + order.Id
                });

                if (request.Status.Equals("Delivered", StringComparison.OrdinalIgnoreCase) && order.Items != null && order.Items.Count > 0)
                {
                    var firstItem = order.Items[0];
                    await _notificationRepository.AddNotificationAsync(new Malieakal.Domain.Entities.Notification
                    {
                        UserId = order.UserId,
                        Role = "Customer",
                        Title = "Leave a Review",
                        Message = "Your order has been delivered! Please leave a review for " + firstItem.ProductName + ".",
                        LinkUrl = "/product/shop/" + firstItem.ProductSlug + "#reviews"
                    });
                }
            }

            return Ok(new { success = true, message = "Order status updated successfully." });
        }

        [HttpPatch("{id}/tracking")]
        public async Task<IActionResult> UpdateTracking(Guid id, [FromBody] UpdateOrderTrackingRequest request)
        {
            await _orderRepository.UpdateOrderTrackingAsync(id, request.DeliveryMethod, request.CourierName, request.TrackingId, request.TrackingUrl);
            return Ok(new { success = true, message = "Order tracking updated successfully." });
        }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateOrderTrackingRequest
    {
        public string? DeliveryMethod { get; set; }
        public string? CourierName { get; set; }
        public string? TrackingId { get; set; }
        public string? TrackingUrl { get; set; }
    }
}
