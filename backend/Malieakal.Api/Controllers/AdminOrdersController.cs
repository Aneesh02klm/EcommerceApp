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

        public AdminOrdersController(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderRepository.GetAllOrdersAsync();
            return Ok(new { success = true, data = orders });
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
        {
            await _orderRepository.UpdateOrderStatusAsync(id, request.Status);
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
