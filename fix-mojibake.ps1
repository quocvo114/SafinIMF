$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

$targets = @('frontend\src', 'backend\src')
$extensions = @('.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.md', '.html')
$markerPattern = '(?:[\u00C2\u00C3\u00C4\u00F0\u00EF\uFFFD]|[\u00E1][\u00BA\u00BB\u00BC\u00BD\u00BE\u00BF]|[\u00E2][\u0080-\u00BF])'
$enc1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Get-Score([string]$text) {
  return ([regex]::Matches($text, $markerPattern)).Count
}

$changedFiles = New-Object System.Collections.Generic.List[string]
$scannedFiles = 0

foreach ($target in $targets) {
  Get-ChildItem -Path $target -Recurse -File |
    Where-Object {
      ($extensions -contains $_.Extension.ToLowerInvariant()) -and
      ($_.FullName -notmatch '\\node_modules\\|\\dist\\|\\build\\|\\.git\\')
    } |
    ForEach-Object {
      $scannedFiles++
      $filePath = $_.FullName
      $original = [System.IO.File]::ReadAllText($filePath)

      if ($original.Length -gt 0 -and $original[0] -eq [char]0xFEFF) {
        $original = $original.Substring(1)
      }

      if ($original -notmatch $markerPattern) {
        return
      }

      $lines = $original -split "`r?`n", -1
      $hasChanges = $false

      for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        if ($line -notmatch $markerPattern) {
          continue
        }

        $best = $line
        $bestScore = Get-Score $line

        try {
          $candidate1 = [System.Text.Encoding]::UTF8.GetString($enc1252.GetBytes($line))
          $candidate1Score = Get-Score $candidate1
          if ($candidate1Score -lt $bestScore) {
            $best = $candidate1
            $bestScore = $candidate1Score
          }

          $candidate2 = [System.Text.Encoding]::UTF8.GetString($enc1252.GetBytes($candidate1))
          $candidate2Score = Get-Score $candidate2
          if ($candidate2Score -lt $bestScore) {
            $best = $candidate2
            $bestScore = $candidate2Score
          }
        }
        catch {
        }

        if (($best -ne $line) -and ($bestScore -lt (Get-Score $line))) {
          $lines[$i] = $best
          $hasChanges = $true
        }
      }

      if ($hasChanges) {
        $fixed = [string]::Join("`r`n", $lines)
        [System.IO.File]::WriteAllText($filePath, $fixed, $utf8NoBom)
        $relative = Resolve-Path -Relative $filePath
        $changedFiles.Add($relative)
      }
    }
}

Write-Output "Scanned: $scannedFiles"
Write-Output "Changed: $($changedFiles.Count)"
$changedFiles | Select-Object -First 300
