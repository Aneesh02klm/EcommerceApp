using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UploadController : ControllerBase
    {
        private readonly IFileService _fileService;

        public UploadController(IFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpPost]
        public async Task<IActionResult> UploadFile(IFormFile file, [FromQuery] string folder = "storefront", [FromQuery] string? oldUrl = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "No file uploaded." });

            string url;
            if (!string.IsNullOrEmpty(oldUrl) && oldUrl.StartsWith("/uploads/"))
            {
                url = await _fileService.ReplaceFileAsync(file.OpenReadStream(), file.FileName, oldUrl, folder);
            }
            else
            {
                url = await _fileService.UploadAsync(file.OpenReadStream(), file.FileName, folder);
            }
            
            return Ok(new { success = true, data = new { url } });
        }
    }
}
