using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Malieakal.Api.Hubs
{
    public class StorefrontHub : Hub
    {
        // Hubs are transient. Methods here can be called by clients.
        // For our use case, we just need to push to clients from the API.
    }
}
