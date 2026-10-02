using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Malieakal.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using System.Linq;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtService _jwtService;

        public AuthController(IUserRepository userRepository, IPasswordHasher passwordHasher, IJwtService jwtService)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new DomainException("Email is already registered.", "EMAIL_IN_USE");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateUserAsync(user, "Customer");

            return Ok(new { success = true, message = "Registration successful." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
            {
                throw new DomainException("Invalid email or password.", "INVALID_CREDENTIALS");
            }

            if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                throw new DomainException("Invalid email or password.", "INVALID_CREDENTIALS");
            }

            var token = _jwtService.GenerateToken(user, user.Roles);

            return Ok(new 
            { 
                success = true, 
                token, 
                user = new { user.Id, user.FirstName, user.LastName, user.Email, Roles = user.Roles.Select(r => r.Name) } 
            });
        }

        [HttpPost("register-guest")]
        public async Task<IActionResult> RegisterGuest([FromBody] RegisterGuestRequest request, [FromServices] IOrderRepository orderRepository)
        {
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                // Just try to link if the password is correct? No, let's just error and say log in.
                throw new DomainException("An account with this email already exists. Please log in.", "EMAIL_IN_USE");
            }

            var order = await orderRepository.GetOrderByIdAsync(request.OrderId);
            if (order == null || order.EmailAddress != request.Email)
            {
                throw new DomainException("Invalid order or email mismatch.", "INVALID_ORDER");
            }

            if (order.UserId != null && order.UserId != Guid.Empty)
            {
                throw new DomainException("This order is already linked to an account.", "ALREADY_LINKED");
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateUserAsync(user, "Customer");

            // Link the order to this newly created user
            await orderRepository.LinkGuestOrderToUserAsync(order.Id, user.Id, user.Email);

            var token = _jwtService.GenerateToken(user, new System.Collections.Generic.List<Malieakal.Domain.Entities.Role> { new Malieakal.Domain.Entities.Role { Name = "Customer" } });

            return Ok(new 
            { 
                success = true, 
                token, 
                user = new { user.Id, user.FirstName, user.LastName, user.Email, Roles = new[] { "Customer" } },
                message = "Account created and order linked successfully." 
            });
        }

        
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (request.Otp != "123456")
                throw new DomainException("Invalid OTP.", "INVALID_OTP");

            var user = await _userRepository.GetByEmailAsync(request.EmailOrPhone);
            if (user == null)
                throw new DomainException("User not found.", "NOT_FOUND");

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateUserAsync(user);

            return Ok(new { success = true, message = "Password updated successfully." });
        }

        [HttpPost("send-otp")]
        public IActionResult SendOtp([FromBody] SendOtpRequest request)
        {
            // In a real app, integrate Twilio/AWS SNS or SendGrid here
            return Ok(new { success = true, message = "OTP sent successfully. (Mock: use 123456)" });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (request.Otp != "123456")
                throw new DomainException("Invalid OTP.", "INVALID_OTP");

            var user = await _userRepository.GetByEmailAsync(request.EmailOrPhone); // Simplifying to email search for mock
            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    FirstName = "User",
                    LastName = "",
                    Email = request.EmailOrPhone.Contains("@") ? request.EmailOrPhone : $"{request.EmailOrPhone}@placeholder.com",
                    Phone = request.EmailOrPhone,
                    PasswordHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString()), 
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _userRepository.CreateUserAsync(user, "Customer");
            }

            var token = _jwtService.GenerateToken(user, new System.Collections.Generic.List<Malieakal.Domain.Entities.Role> { new Malieakal.Domain.Entities.Role { Name = "Customer" } });

            return Ok(new 
            { 
                success = true, 
                token, 
                user = new { user.Id, user.FirstName, user.LastName, user.Email, Roles = new[] { "Customer" } } 
            });
        }
    }

    public class RegisterGuestRequest
    {
        [Required] public Guid OrderId { get; set; }
        [Required] public string FirstName { get; set; } = string.Empty;
        [Required] public string LastName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }

    public class RegisterRequest
    {
        [Required] public string FirstName { get; set; } = string.Empty;
        [Required] public string LastName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }

    public class LoginRequest
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public string Password { get; set; } = string.Empty;
    }

    public class SendOtpRequest
    {
        [Required] public string EmailOrPhone { get; set; } = string.Empty;
    }

    
    public class ResetPasswordRequest
    {
        [System.ComponentModel.DataAnnotations.Required] public string EmailOrPhone { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Required] public string Otp { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Required] public string NewPassword { get; set; } = string.Empty;
    }

    public class VerifyOtpRequest
    {
        [Required] public string EmailOrPhone { get; set; } = string.Empty;
        [Required] public string Otp { get; set; } = string.Empty;
    }
}
