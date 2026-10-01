using System;
using System.Text.Json;
using System.Threading.Tasks;
using Malieakal.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Malieakal.Api.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred.");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            var statusCode = StatusCodes.Status500InternalServerError;
            var message = "Unable to complete the request.";
            var code = "REQUEST_FAILED";
            var traceId = context.TraceIdentifier;

            if (exception is DomainException domainException)
            {
                statusCode = StatusCodes.Status400BadRequest;
                message = domainException.Message;
                code = domainException.Code;
            }

            context.Response.StatusCode = statusCode;

            var response = new
            {
                success = false,
                message,
                code,
                traceId,
                errors = Array.Empty<string>()
            };

            return context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
