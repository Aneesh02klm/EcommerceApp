using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/addresses")]
    [Authorize]
    public class AddressController : ControllerBase
    {
        private readonly IOrderRepository _orderRepository;

        public AddressController(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET /api/v1/addresses — list all addresses for the authenticated user
        [HttpGet]
        public async Task<IActionResult> GetAddresses()
        {
            var userId = GetUserId();
            var addresses = await _orderRepository.GetAddressesByUserIdAsync(userId);
            return Ok(new { success = true, data = addresses, message = "Addresses retrieved." });
        }

        // POST /api/v1/addresses — create a new address
        [HttpPost]
        public async Task<IActionResult> CreateAddress([FromBody] AddressUpsertRequest request)
        {
            var userId = GetUserId();

            var address = new Address
            {
                UserId = userId,
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                AddressType = request.AddressType,
                FlatHouseNo = request.FlatHouseNo,
                AreaStreet = request.AreaStreet,
                AddressLine1 = request.AddressLine1 ?? request.FlatHouseNo ?? string.Empty,
                AddressLine2 = request.AddressLine2,
                City = request.City,
                State = request.State,
                Pincode = request.Pincode,
                IsDefault = request.IsDefault
            };

            var id = await _orderRepository.CreateAddressAsync(address);
            address.Id = id;

            if (request.IsDefault)
            {
                await _orderRepository.SetDefaultAddressAsync(id, userId);
            }

            return Ok(new { success = true, data = address, message = "Address created successfully." });
        }

        // PUT /api/v1/addresses/{id} — update an existing address (IDOR-safe)
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] AddressUpsertRequest request)
        {
            var userId = GetUserId();

            // Verify ownership before update
            var existing = await _orderRepository.GetAddressByIdAsync(id, userId);
            if (existing == null)
                return NotFound(new { success = false, message = "Address not found or does not belong to this account." });

            existing.FullName = request.FullName;
            existing.Email = request.Email;
            existing.Phone = request.Phone;
            existing.AddressType = request.AddressType;
            existing.FlatHouseNo = request.FlatHouseNo;
            existing.AreaStreet = request.AreaStreet;
            existing.AddressLine1 = request.AddressLine1 ?? request.FlatHouseNo ?? existing.AddressLine1;
            existing.AddressLine2 = request.AddressLine2;
            existing.City = request.City;
            existing.State = request.State;
            existing.Pincode = request.Pincode;
            existing.IsDefault = request.IsDefault;

            await _orderRepository.UpdateAddressAsync(existing, userId);

            if (request.IsDefault)
            {
                await _orderRepository.SetDefaultAddressAsync(id, userId);
            }

            return Ok(new { success = true, data = existing, message = "Address updated successfully." });
        }

        // DELETE /api/v1/addresses/{id} — delete an address (IDOR-safe)
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var userId = GetUserId();

            var existing = await _orderRepository.GetAddressByIdAsync(id, userId);
            if (existing == null)
                return NotFound(new { success = false, message = "Address not found or does not belong to this account." });

            if (existing.IsDefault)
                return BadRequest(new { success = false, message = "Cannot delete the default address. Please set a new default address first." });

            var deleted = await _orderRepository.DeleteAddressAsync(id, userId);
            if (!deleted)
                return NotFound(new { success = false, message = "Address not found or does not belong to this account." });

            return Ok(new { success = true, message = "Address deleted successfully." });
        }

        // PATCH /api/v1/addresses/{id}/set-default — set as default address (IDOR-safe)
        [HttpPatch("{id:int}/set-default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            var userId = GetUserId();

            // Verify ownership first
            var existing = await _orderRepository.GetAddressByIdAsync(id, userId);
            if (existing == null)
                return NotFound(new { success = false, message = "Address not found or does not belong to this account." });

            await _orderRepository.SetDefaultAddressAsync(id, userId);
            return Ok(new { success = true, message = "Default address updated." });
        }
    }

    public class AddressUpsertRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string AddressType { get; set; } = "Home"; // Home, Work, Other
        public string? FlatHouseNo { get; set; }
        public string? AreaStreet { get; set; }
        public string? AddressLine1 { get; set; } // backward compat
        public string? AddressLine2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }
}
