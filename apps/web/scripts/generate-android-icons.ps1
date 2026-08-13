$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sourcePath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\public\assets\images\brand-symbol.png'))
$resourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\android\app\src\main\res'))
$source = [Drawing.Bitmap]::new($sourcePath)

function Write-Icon([string]$targetPath, [int]$size, [double]$scale) {
  $canvas = [Drawing.Bitmap]::new($size, $size, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [Drawing.Graphics]::FromImage($canvas)
  try {
    $graphics.Clear([Drawing.Color]::White)
    $graphics.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
    $drawSize = [int][Math]::Round($size * $scale)
    $offset = [int][Math]::Round(($size - $drawSize) / 2)
    $graphics.DrawImage($source, $offset, $offset, $drawSize, $drawSize)
    $canvas.Save($targetPath, [Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $canvas.Dispose()
  }
}

try {
  $densities = @{
    'mdpi' = @{ launcher = 48; foreground = 108 }
    'hdpi' = @{ launcher = 72; foreground = 162 }
    'xhdpi' = @{ launcher = 96; foreground = 216 }
    'xxhdpi' = @{ launcher = 144; foreground = 324 }
    'xxxhdpi' = @{ launcher = 192; foreground = 432 }
  }

  foreach ($density in $densities.Keys) {
    $directory = Join-Path $resourceRoot "mipmap-$density"
    Write-Icon (Join-Path $directory 'ic_launcher.png') $densities[$density].launcher 0.82
    Write-Icon (Join-Path $directory 'ic_launcher_round.png') $densities[$density].launcher 0.72
    Write-Icon (Join-Path $directory 'ic_launcher_foreground.png') $densities[$density].foreground 0.66
  }
} finally {
  $source.Dispose()
}

Write-Output 'Ícones Android do Sanetes gerados.'
