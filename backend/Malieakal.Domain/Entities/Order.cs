using System;
using System.Collections.Generic;

namespace Malieakal.Domain.Entities
{
    public class OrderItem
    {
        public int Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public string? ProductImage { get; set; }
        public string? ProductSlug { get; set; }
        public string? CategorySlug { get; set; }
        public string? BrandSlug { get; set; }
        public string? WarrantyPeriod { get; set; }
        public DateTime? WarrantyExpiryDate { get; set; }
        public string? WarrantyStatus { get; set; }
    }

    public class Payment
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public string? RazorpayOrderId { get; set; } // nullable for COD orders
        public string? RazorpayPaymentId { get; set; }
        public string? RazorpaySignature { get; set; }
        public string Status { get; set; } = "Created"; // Created, Success, Failed, COD_Pending
        public decimal Amount { get; set; }
        public string? Method { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Order
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal SubTotal { get; set; }
        public decimal Discount { get; set; }
        public decimal ShippingCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public string? PromoCode { get; set; }
        public decimal PromoDiscount { get; set; }
        public int? ShippingAddressId { get; set; }
        public string Status { get; set; } = "Pending";
        public string PaymentMethod { get; set; } = "Razorpay"; // Razorpay, COD
        public string? EmailAddress { get; set; }
        public string? DeliveryAddressSnapshot { get; set; } // JSONB stored as string
        
        // Order Tracking & Logistics
        public string? DeliveryMethod { get; set; } // "In-House" or "Third-Party"
        public string? CourierName { get; set; }
        public string? TrackingId { get; set; }
        public string? TrackingUrl { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<OrderItem> Items { get; set; } = new();
        public Address? ShippingAddress { get; set; }
        public Payment? PaymentInfo { get; set; }
    }
}
