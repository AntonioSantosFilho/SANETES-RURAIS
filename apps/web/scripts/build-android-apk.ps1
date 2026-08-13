$ErrorActionPreference = 'Stop'
$webRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$androidStudioJdk = 'C:\Program Files\Android\Android Studio\jbr'
$previousJavaHome = $env:JAVA_HOME

if (Test-Path (Join-Path $androidStudioJdk 'bin\java.exe')) {
  $env:JAVA_HOME = $androidStudioJdk
}

try {
  Push-Location $webRoot
  & npm.cmd run android:sync
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao sincronizar o projeto Android.' }

  Push-Location (Join-Path $webRoot 'android')
  & .\gradlew.bat assembleDebug
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o APK.' }
} finally {
  Pop-Location -ErrorAction SilentlyContinue
  Pop-Location -ErrorAction SilentlyContinue
  $env:JAVA_HOME = $previousJavaHome
}

Write-Output 'APK gerado em android\app\build\outputs\apk\debug\app-debug.apk'
