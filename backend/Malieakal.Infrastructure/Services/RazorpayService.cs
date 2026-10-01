using Malieakal.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Razorpay.Api;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Services
{
    public class RazorpayService : IPaymentService
    {
        private readonly string _key;
        private readonly string _secret;

        public RazorpayService(IConfiguration configuration)
        {
            _key = configuration["Razorpay:KeyId"]!;
            _secret = configuration["Razorpay:KeySecret"]!;
        }

        public Task<string> CreateRazorpayOrderAsync(decimal amount, string receiptId)
        {
            // Amount must be in subunits (paise for INR)
            var amountInPaise = (int)(amount * 100);

            var client = new RazorpayClient(_key, _secret);
            
            var options = new Dictionary<string, object>
            {
                { "amount", amountInPaise },
                { "currency", "INR" },
                { "receipt", receiptId }
            };

            var order = client.Order.Create(options);
            return Task.FromResult(order["id"].ToString());
        }

        public bool VerifySignature(string razorpayOrderId, string razorpayPaymentId, string signature)
        {
            try
            {
                var attributes = new Dictionary<string, string>
                {
                    { "razorpay_order_id", razorpayOrderId },
                    { "razorpay_payment_id", razorpayPaymentId },
                    { "razorpay_signature", signature }
                };

                Utils.verifyPaymentSignature(attributes);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
