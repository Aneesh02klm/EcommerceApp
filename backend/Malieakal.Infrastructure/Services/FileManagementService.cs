using Malieakal.Application.Abstractions;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Services
{
    public class FileManagementService : IFileService
    {
        private readonly string _webRootPath;

        public FileManagementService()
        {
            _webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        public async Task<string> UploadAsync(Stream fileStream, string fileName, string subFolder)
        {
            if (fileStream == null || fileStream.Length == 0)
                throw new ArgumentException("File stream is empty or null.");

            var folderPath = Path.Combine(_webRootPath, "uploads", subFolder);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var extension = Path.GetExtension(fileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(folderPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(stream);
            }

            return $"/uploads/{subFolder}/{uniqueFileName}";
        }

        public void DeleteFile(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return;

            var cleanPath = relativePath.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar);
            var filePath = Path.Combine(_webRootPath, cleanPath);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }

        public async Task<string> ReplaceFileAsync(Stream newFileStream, string fileName, string oldRelativePath, string subFolder)
        {
            DeleteFile(oldRelativePath);
            return await UploadAsync(newFileStream, fileName, subFolder);
        }
    }
}
