using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IPaymentService
    {
        Task<string> CreateRazorpayOrderAsync(decimal amount, string receiptId);
        bool VerifySignature(string razorpayOrderId, string razorpayPaymentId, string signature);
    }
}
