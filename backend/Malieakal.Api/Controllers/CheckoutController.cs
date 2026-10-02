using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CheckoutController : ControllerBase
    {
        private readonly ICartRepository _cartRepository;
        private readonly IProductRepository _productRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IPaymentService _paymentService;
        private readonly IUserRepository _userRepository;
        private readonly Malieakal.Application.Services.IDeliveryEngineService _deliveryEngine;
        private readonly ICouponRepository _couponRepository;

        public CheckoutController(
            ICartRepository cartRepository,
            IProductRepository productRepository,
            IOrderRepository orderRepository,
            IPaymentService paymentService,
            IUserRepository userRepository,
            Malieakal.Application.Services.IDeliveryEngineService deliveryEngine,
            ICouponRepository couponRepository)
        {
            _cartRepository = cartRepository;
            _productRepository = productRepository;
            _orderRepository = orderRepository;
            _paymentService = paymentService;
            _userRepository = userRepository;
            _deliveryEngine = deliveryEngine;
            _couponRepository = couponRepository;
        }

        private Guid? GetUserId() 
        {
            if (User?.Identity?.IsAuthenticated == true) 
                return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return null;
        }

        [HttpPost("initiate")]
        public async Task<IActionResult> InitiateCheckout([FromBody] InitiateCheckoutRequest request)
        {
            var userId = GetUserId();

            // ── Validate cart ──────────────────────────────────────────────────
            Cart? cart = null;

            if (request.Items != null && request.Items.Any())
            {
                // Guest or Frontend-provided cart
                cart = new Cart { UserId = userId ?? Guid.Empty, Items = new List<CartItem>() };
                foreach (var reqItem in request.Items)
                {
                    var product = await _productRepository.GetByIdAsync(reqItem.ProductId);
                    if (product != null)
                    {
                        cart.Items.Add(new CartItem {
                            ProductId = product.Id,
                            Product = product,
                            Quantity = reqItem.Quantity
                        });
                    }
                }
                if (!cart.Items.Any()) return BadRequest(new { success = false, message = "Invalid items in cart." });
                // TotalMRP, FinalTotal, TotalDiscount are computed automatically by the domain model based on items.
            }
            else if (userId.HasValue)
            {
                // Authenticated DB cart
                cart = await _cartRepository.GetCartByUserIdAsync(userId.Value);
            }

            if (cart == null || !cart.Items.Any())
                return BadRequest(new { success = false, message = "Cart is empty." });

            // ── Resolve address ────────────────────────────────────────────────
            Address? resolvedAddress = null;
            int resolvedAddressId = 0;

            if (request.AddressId.HasValue && userId.HasValue)
            {
                // Load saved address — IDOR-safe
                resolvedAddress = await _orderRepository.GetAddressByIdAsync(request.AddressId.Value, userId.Value);
                if (resolvedAddress == null)
                    return BadRequest(new { success = false, message = "Address not found." });
                resolvedAddressId = resolvedAddress.Id;
            }
            else
            {
                // Validate inline address fields
                if (string.IsNullOrWhiteSpace(request.FullName) ||
                    string.IsNullOrWhiteSpace(request.Phone) ||
                    string.IsNullOrWhiteSpace(request.City) ||
                    string.IsNullOrWhiteSpace(request.State) ||
                    string.IsNullOrWhiteSpace(request.Pincode) ||
                    (string.IsNullOrWhiteSpace(request.FlatHouseNo) && string.IsNullOrWhiteSpace(request.AddressLine1)))
                {
                    return BadRequest(new { success = false, message = "Inline address is missing required fields (FullName, Phone, FlatHouseNo or AddressLine1, City, State, Pincode)." });
                }

                resolvedAddress = new Address
                {
                    UserId = userId ?? Guid.Empty, // won't save if empty
                    FullName = request.FullName!,
                    Email = request.EmailAddress,
                    Phone = request.Phone!,
                    AddressType = request.AddressType,
                    FlatHouseNo = request.FlatHouseNo,
                    AreaStreet = request.AreaStreet,
                    AddressLine1 = request.AddressLine1 ?? request.FlatHouseNo ?? string.Empty,
                    AddressLine2 = request.AddressLine2,
                    City = request.City!,
                    State = request.State!,
                    Pincode = request.Pincode!,
                    IsDefault = false
                };

                // Optionally persist the inline address ONLY if logged in
                if (request.SaveAddress && userId.HasValue)
                {
                    resolvedAddress.IsDefault = request.IsDefault;
                    resolvedAddressId = await _orderRepository.CreateAddressAsync(resolvedAddress);
                    resolvedAddress.Id = resolvedAddressId;

                    if (request.IsDefault)
                    {
                        await _orderRepository.SetDefaultAddressAsync(resolvedAddressId, userId.Value);
                    }
                }
            }

            // ── Resolve email ──────────────────────────────────────────────────
            var email = request.EmailAddress;
            if (string.IsNullOrWhiteSpace(email) && userId.HasValue)
            {
                var user = await _userRepository.GetByIdAsync(userId.Value);
                email = user?.Email;
            }

            // ── Build address snapshot ─────────────────────────────────────────
            var snapshotJson = JsonSerializer.Serialize(new
            {
                resolvedAddress.FullName,
                Email = email,
                resolvedAddress.Phone,
                resolvedAddress.AddressType,
                resolvedAddress.FlatHouseNo,
                resolvedAddress.AreaStreet,
                resolvedAddress.City,
                resolvedAddress.State,
                resolvedAddress.Pincode
            });

            // ── Calculate Delivery Charge securely on Backend ──────────
            var deliveryCalculation = await _deliveryEngine.CalculateDeliveryAsync(resolvedAddress.Pincode, resolvedAddress.State);
            if (!deliveryCalculation.IsServiceable) {
                return BadRequest(new { success = false, message = "The selected address is out of our delivery service area." });
            }
            var deliveryCharge = deliveryCalculation.Charge;

            // ── Calculate Promo Code ──
            decimal promoDiscount = 0;
            string? appliedPromoCode = null;
            if (!string.IsNullOrWhiteSpace(request.PromoCode))
            {
                var coupon = await _couponRepository.GetByCodeAsync(request.PromoCode, GetUserId());
                if (coupon != null && cart.FinalTotal >= coupon.MinOrderAmount)
                {
                    appliedPromoCode = coupon.Code;
                    if (coupon.DiscountType == "Percentage")
                    {
                        var discount = cart.FinalTotal * (coupon.DiscountValue / 100m);
                        if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
                        {
                            discount = coupon.MaxDiscountAmount.Value;
                        }
                        promoDiscount = discount;
                    }
                    else // Flat
                    {
                        promoDiscount = coupon.DiscountValue;
                    }

                    // ensure promo discount doesn't exceed cart total
                    if (promoDiscount > cart.FinalTotal) promoDiscount = cart.FinalTotal;
                }
            }

            // ── Build order (prices come from DB cart — never trust frontend) ──
            
            // â”€â”€ Validate Stock BEFORE Checkout (Race Condition Fix) â”€â”€
            foreach (var item in cart.Items)
            {
                var p = await _productRepository.GetByIdAsync(item.ProductId);
                if (p == null || p.Stock < item.Quantity)
                {
                    return BadRequest(new { success = false, message = $"Sorry, '{item.Product?.Name ?? "an item"}' is out of stock or does not have enough quantity available." });
                }
            }

            var order = new Order
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{new Random().Next(100, 999)}",
                SubTotal = cart.TotalMRP,
                Discount = cart.TotalDiscount,
                ShippingCharges = deliveryCharge,
                PromoCode = appliedPromoCode,
                PromoDiscount = promoDiscount,
                TotalAmount = cart.FinalTotal + deliveryCharge - promoDiscount, // Include delivery charge and subtract promo!
                ShippingAddressId = resolvedAddressId > 0 ? resolvedAddressId : null,
                PaymentMethod = request.PaymentMethod,
                EmailAddress = email,
                DeliveryAddressSnapshot = snapshotJson,
                Status = "Pending"
            };

            foreach (var item in cart.Items)
            {
                order.Items.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product?.Name ?? "Unknown Product",
                    Price = item.Product?.FinalPrice ?? 0,
                    Quantity = item.Quantity
                });
            }

            // ── COD flow ───────────────────────────────────────────────────────
            if (request.PaymentMethod == "COD")
            {
                order.Status = "Confirmed";

                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    RazorpayOrderId = null,
                    Status = "COD_Pending",
                    Amount = order.TotalAmount,
                    Method = "COD"
                };
                payment.OrderId = order.Id;

                                await _orderRepository.CreateOrderAsync(order, payment);

                // Deduct stock for COD
                foreach (var item in cart.Items)
                {
                    await _productRepository.UpdateStockAsync(item.ProductId, -item.Quantity);
                }

                await _cartRepository.ClearCartAsync(cart.Id);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        orderId = order.Id,
                        paymentMethod = "COD"
                    },
                    message = "Order placed successfully. Pay on delivery."
                });
            }

            // ── Razorpay flow ──────────────────────────────────────────────────
            var razorpayOrderId = await _paymentService.CreateRazorpayOrderAsync(order.TotalAmount, order.OrderNumber);

            var razorpayPayment = new Payment
            {
                Id = Guid.NewGuid(),
                RazorpayOrderId = razorpayOrderId,
                Status = "Created",
                Amount = order.TotalAmount,
                Method = "Razorpay"
            };
            razorpayPayment.OrderId = order.Id;

            await _orderRepository.CreateOrderAsync(order, razorpayPayment);

            return Ok(new
            {
                success = true,
                data = new
                {
                    orderId = order.Id,
                    razorpayOrderId,
                    amount = order.TotalAmount,
                    paymentMethod = "Razorpay"
                },
                message = "Order created. Proceed to payment."
            });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request)
        {
            var isValid = _paymentService.VerifySignature(
                request.RazorpayOrderId,
                request.RazorpayPaymentId,
                request.RazorpaySignature);

            if (!isValid)
            {
                await _orderRepository.UpdatePaymentStatusAsync(
                    request.OrderId, request.RazorpayPaymentId, request.RazorpaySignature, "Failed");
                return BadRequest(new { success = false, message = "Payment verification failed." });
            }

            await _orderRepository.UpdatePaymentStatusAsync(
                request.OrderId, request.RazorpayPaymentId, request.RazorpaySignature, "Success");
                
            var order = await _orderRepository.GetOrderByIdAsync(request.OrderId);
            if (order != null && order.Items != null)
            {
                foreach (var item in order.Items)
                {
                    await _productRepository.UpdateStockAsync(item.ProductId, -item.Quantity);
                }
                
                // Clear cart (find cart by user id)
                if (order.UserId.HasValue)
                {
                    var cart = await _cartRepository.GetCartByUserIdAsync(order.UserId.Value);
                    if (cart != null)
                    {
                        await _cartRepository.ClearCartAsync(cart.Id);
                    }
                }
                
            }
                
            return Ok(new { success = true, message = "Payment successful." });
        }
    }

    public class InitiateCheckoutRequest
    {
        public int? AddressId { get; set; } // nullable: if null, use inline address
        public string? EmailAddress { get; set; }
        public string PaymentMethod { get; set; } = "Razorpay"; // "Razorpay" or "COD"
        public string? PromoCode { get; set; }
        public List<CheckoutCartItem>? Items { get; set; } // For guest checkout

        // Inline address fields (used when user fills a new address without saving)
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? FlatHouseNo { get; set; }
        public string? AreaStreet { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string AddressType { get; set; } = "Home";
        public bool SaveAddress { get; set; } = false; // whether to persist inline address
        public bool IsDefault { get; set; } = false; // whether to set as default
    }

    public class CheckoutCartItem
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class VerifyPaymentRequest
    {
        public Guid OrderId { get; set; }
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }
}
