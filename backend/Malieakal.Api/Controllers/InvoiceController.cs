using Malieakal.Api.Services;
using Malieakal.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/orders/{orderId}/invoice")]
    public class InvoiceController : ControllerBase
    {
        private readonly IOrderRepository _orderRepository;

        public InvoiceController(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> DownloadInvoice(Guid orderId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var order = await _orderRepository.GetOrderByIdAsync(orderId);

            bool isAdmin = User.IsInRole("Admin");
            if (order == null || (!isAdmin && order.UserId != userId))
            {
                return NotFound(new { success = false, message = "Order not found or access denied." });
            }

            var document = new InvoiceDocument(order);
            var pdfBytes = document.GeneratePdf();

            var fileName = $"Invoice_{order.OrderNumber}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
    }
}
