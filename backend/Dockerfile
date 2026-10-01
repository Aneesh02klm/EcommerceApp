# Use the official .NET 10 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["Malieakal.Api/Malieakal.Api.csproj", "Malieakal.Api/"]
COPY ["Malieakal.Application/Malieakal.Application.csproj", "Malieakal.Application/"]
COPY ["Malieakal.Domain/Malieakal.Domain.csproj", "Malieakal.Domain/"]
COPY ["Malieakal.Infrastructure/Malieakal.Infrastructure.csproj", "Malieakal.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "Malieakal.Api/Malieakal.Api.csproj"

# Copy the remaining source code
COPY . .
WORKDIR "/src/Malieakal.Api"

# Build and publish the application
RUN dotnet publish "Malieakal.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET 10 runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port 5000 (standard for this API)
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "Malieakal.Api.dll"]
