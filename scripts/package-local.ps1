$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$releaseRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseVersion = (Get-Content -LiteralPath (Join-Path $releaseRoot 'package.json') -Raw | ConvertFrom-Json).version
$releaseName = 'computer-lab-' + $releaseVersion
$releaseOutput = Join-Path $releaseRoot 'deliverables'
New-Item -ItemType Directory -Path $releaseOutput -Force | Out-Null
$releaseArchive = Join-Path $releaseOutput ($releaseName + '.zip')
if (Test-Path -LiteralPath $releaseArchive) { throw ('交付包已存在，请先保留或移开该版本：' + $releaseArchive) }
$releaseSkip = @('.git','node_modules','outputs','work','deliverables','dist-pages','.openai','.codex','.agents','.vercel','.wrangler')
$releaseQueue = [Collections.Generic.Stack[string]]::new()
$releaseQueue.Push($releaseRoot)
$releaseFiles = [Collections.Generic.List[string]]::new()
while ($releaseQueue.Count -gt 0) {
  $releaseFolder = $releaseQueue.Pop()
  foreach ($releaseChild in Get-ChildItem -LiteralPath $releaseFolder -Force) {
    if ($releaseChild.PSIsContainer) {
      if ($releaseChild.Name -notin $releaseSkip) { $releaseQueue.Push($releaseChild.FullName) }
    } elseif ($releaseChild.Name -notlike '.env*' -and $releaseChild.Name -notlike '*.tsbuildinfo') {
      $releaseFiles.Add($releaseChild.FullName)
    }
  }
}
$releaseZip = [IO.Compression.ZipFile]::Open($releaseArchive,[IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($releaseFile in $releaseFiles) {
    $releaseRelative = $releaseFile.Substring($releaseRoot.Length + 1).Replace([char]92,[char]47)
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($releaseZip,$releaseFile,($releaseName + '/' + $releaseRelative),[IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $releaseZip.Dispose() }
# 必须重新读取 ZIP，核对顶层目录、实际版本与启动文件。
$releaseRead = [IO.Compression.ZipFile]::OpenRead($releaseArchive)
try {
  if (@($releaseRead.Entries | Where-Object { -not $_.FullName.StartsWith($releaseName + '/') }).Count -gt 0) { throw '包内顶层目录与当前版本不一致。' }
  $releasePackage = $releaseRead.GetEntry($releaseName + '/package.json')
  $releaseReader = [IO.StreamReader]::new($releasePackage.Open())
  try { $releaseInnerVersion = ($releaseReader.ReadToEnd() | ConvertFrom-Json).version } finally { $releaseReader.Dispose() }
  if ($releaseInnerVersion -ne $releaseVersion) { throw '包内 package.json 版本不一致。' }
  foreach ($releaseRequired in @('dist/index.html','scripts/serve-local.mjs','启动电脑实验室.cmd','使用说明.md','LICENSE')) {
    if (-not $releaseRead.GetEntry($releaseName + '/' + $releaseRequired)) { throw ('缺少交付文件：' + $releaseRequired) }
  }
  $releaseCount = $releaseRead.Entries.Count
} finally { $releaseRead.Dispose() }
$releaseHash = (Get-FileHash -LiteralPath $releaseArchive -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $releaseOutput ($releaseName + '.sha256.txt')),($releaseHash + '  ' + $releaseName + '.zip' + [Environment]::NewLine),[Text.UTF8Encoding]::new($false))
[pscustomobject]@{version=$releaseVersion;archive=$releaseArchive;entries=$releaseCount;bytes=(Get-Item -LiteralPath $releaseArchive).Length;sha256=$releaseHash;validated=$true} | ConvertTo-Json -Compress
