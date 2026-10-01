$targetDir = "C:\Users\acer\source\repos\Projects\EcommerceApp\backend\Malieakal.Api\wwwroot\uploads"

# 1x1 pixel transparent PNG in base64
$dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
$bytes = [Convert]::FromBase64String($dummyBase64)

# Create folders
$folders = @("products", "categories", "brands", "banners", "blogs", "features")
foreach ($folder in $folders) {
    $path = Join-Path $targetDir $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
    }
}

# Define dummy files needed by the seed
$files = @(
    "categories\washing-machine.jpg",
    "categories\refrigerator.jpg",
    "categories\tv.jpg",
    "categories\ac.jpg",
    "categories\kitchen.jpg",
    "categories\audio.jpg",
    "categories\mobile.jpg",
    "categories\laptop.jpg",
    "brands\lg.png",
    "brands\samsung.png",
    "brands\sony.png",
    "brands\daikin.png",
    "brands\whirlpool.png",
    "brands\panasonic.png",
    "brands\apple.png",
    "brands\bosch.png",
    "brands\croma.png",
    "banners\hero1.jpg",
    "features\shield.png",
    "features\truck.png",
    "features\badge.png",
    "features\card.png",
    "blogs\ac-guide.jpg",
    "blogs\fridge-guide.jpg",
    "blogs\tv-guide.jpg"
)

foreach ($file in $files) {
    $filePath = Join-Path $targetDir $file
    [IO.File]::WriteAllBytes($filePath, $bytes)
}

Write-Host "Dummy images created physically in wwwroot/uploads!"
