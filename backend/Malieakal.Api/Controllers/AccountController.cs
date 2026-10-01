using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly IAccountRepository _accountRepository;

        public AccountController(IAccountRepository accountRepository)
        {
            _accountRepository = accountRepository;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var dashboard = await _accountRepository.GetDashboardAsync(userId);
            if (dashboard == null) return NotFound();

            return Ok(new { success = true, data = dashboard });
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses() => Ok(new { success = true, data = await _accountRepository.GetAddressesAsync(GetUserId()) });

        [HttpGet("coupons")]
        public async Task<IActionResult> GetCoupons() => Ok(new { success = true, data = await _accountRepository.GetCouponsAsync(GetUserId()) });

        [HttpGet("rewards")]
        public async Task<IActionResult> GetRewards() => Ok(new { success = true, data = await _accountRepository.GetRewardsAsync(GetUserId()) });

        [HttpGet("warranty")]
        public async Task<IActionResult> GetWarranties() => Ok(new { success = true, data = await _accountRepository.GetWarrantiesAsync(GetUserId()) });

        [HttpGet("complaints")]
        public async Task<IActionResult> GetComplaints() => Ok(new { success = true, data = await _accountRepository.GetComplaintsAsync(GetUserId()) });

        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications() => Ok(new { success = true, data = await _accountRepository.GetNotificationsAsync(GetUserId()) });

        [HttpGet("notification-settings")]
        public async Task<IActionResult> GetNotificationSettings() => Ok(new { success = true, data = await _accountRepository.GetSettingsAsync(GetUserId()) });

        [HttpGet("payment-methods")]
        public async Task<IActionResult> GetPaymentMethods() => Ok(new { success = true, data = await _accountRepository.GetPaymentMethodsAsync(GetUserId()) });
    }
}
