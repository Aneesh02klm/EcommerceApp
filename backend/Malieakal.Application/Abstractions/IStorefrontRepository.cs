using System.Text.Json;
using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IStorefrontRepository
    {
        Task<JsonElement> GetDraftConfigAsync();
        Task<JsonElement> GetPublishedConfigAsync();
        Task UpdateDraftConfigAsync(JsonElement configJson);
        Task PublishConfigAsync();
        
        Task<int> CreatePreBookingAsync(PreBookingEnquiry enquiry);
        Task<IEnumerable<PreBookingEnquiry>> GetPreBookingsAsync();
        Task UpdatePreBookingStatusAsync(int id, string status);
    }
}
