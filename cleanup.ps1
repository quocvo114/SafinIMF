#!/usr/bin/env pwsh

# ============================================
# Code Cleanup Script for frontend/src (PowerShell)
# ============================================
# Usage: .\cleanup.ps1 -Action <action>
# ============================================

param(
    [ValidateSet('find-console', 'find-useeffect', 'find-keys', 'report', 'remove', 'restore', 'eslint', 'full', 'menu')]
    [string]$Action = 'menu'
)

$ErrorActionPreference = 'Stop'

# Get paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommandPath
$FrontendSrc = Join-Path $ScriptDir 'frontend' 'src'

# Colors
$Colors = @{
    Red    = "`e[31m"
    Green  = "`e[32m"
    Yellow = "`e[33m"
    Reset  = "`e[0m"
}

function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error { Write-Host "❌ $_" -ForegroundColor Red }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }

# ============================================
# 1. Find console.log instances
# ============================================
function Find-ConsoleLogs {
    Write-Info "Scanning for console.log instances..."
    
    $Results = Get-ChildItem -Path $FrontendSrc -Recurse -Include '*.jsx', '*.js' |
        Select-String -Pattern 'console\.' |
        Group-Object -Property Path
    
    Write-Host ""
    Write-Success "Found in $($Results.Count) files:`n"
    
    foreach ($group in $Results) {
        $file = Split-Path -Leaf $group.Name
        $count = @($group.Group).Count
        Write-Host "  📄 $file : $count instances"
        
        # Show first 3 lines
        $group.Group | Select-Object -First 3 | ForEach-Object {
            Write-Host "     Line $($_.LineNumber): $($_.Line.Trim())" -ForegroundColor DarkGray
        }
    }
    
    Write-Host ""
    Write-Info "Total console.log instances: $($Results | Measure-Object -Sum -Property {$_.Group.Count} | % Sum)"
}

# ============================================
# 2. Find useEffect issues
# ============================================
function Find-UseEffectIssues {
    Write-Info "Scanning for useEffect..."
    
    $Results = Get-ChildItem -Path $FrontendSrc -Recurse -Include '*.jsx', '*.js' |
        Select-String -Pattern 'useEffect' |
        Group-Object -Property Path
    
    Write-Host ""
    Write-Success "Found $($Results.Count) files with useEffect`n"
    
    foreach ($group in $Results) {
        $file = Split-Path -Leaf $group.Name
        $count = @($group.Group).Count
        Write-Host "  📄 $file : $count useEffect(s)"
    }
}

# ============================================
# 3. Find missing keys in .map()
# ============================================
function Find-MissingKeys {
    Write-Info "Scanning for missing keys in .map()..."
    
    $Results = Get-ChildItem -Path $FrontendSrc -Recurse -Include '*.jsx', '*.js' |
        Select-String -Pattern '\.map\(' |
        Where-Object { $_ -notmatch 'key=' }
    
    Write-Host ""
    if ($Results) {
        Write-Warning "Found $($Results.Count) potential missing keys`n"
        $Results | Select-Object -First 10 | ForEach-Object {
            Write-Host "  📄 $(Split-Path -Leaf $_.Path) : Line $($_.LineNumber)"
            Write-Host "     $($_.Line.Trim())" -ForegroundColor DarkGray
        }
    } else {
        Write-Success "No missing keys found!"
    }
}

# ============================================
# 4. Generate cleanup report
# ============================================
function Generate-Report {
    Write-Info "Generating cleanup report..."
    
    $Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $ReportPath = Join-Path $ScriptDir "CLEANUP_REPORT_$Timestamp.txt"
    
    $Report = @"
=== Code Cleanup Report ===
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
================================================

## Summary Statistics

"@
    
    # Console.log count
    $ConsoleLogs = Get-ChildItem -Path $FrontendSrc -Recurse -Include '*.jsx', '*.js' |
        Select-String -Pattern 'console\.' |
        Measure-Object | % Count
    
    $Report += "`nConsole.log instances: $ConsoleLogs`n"
    
    # useEffect count
    $UseEffects = Get-ChildItem -Path $FrontendSrc -Recurse -Include '*.jsx', '*.js' |
        Select-String -Pattern 'useEffect' |
        Measure-Object | % Count
    
    $Report += "useEffect instances: $UseEffects`n"
    
    # Top files with issues
    $Report += "`n## Top 10 Files with Most console.log`n"
    $Report += "=========================================`n"
    
    Get-ChildItem -Path $FrontendSrc -Recurse -Include '*.jsx', '*.js' |
        ForEach-Object {
            $count = @(Select-String -Path $_.FullName -Pattern 'console\.' | Measure-Object).Count
            [PSCustomObject]@{
                File = $_.Name
                Count = $count
                Path = $_.FullName
            }
        } |
        Sort-Object -Property Count -Descending |
        Select-Object -First 10 |
        ForEach-Object {
            $Report += "$($_.File): $($_.Count)`n"
        }
    
    $Report | Out-File -FilePath $ReportPath -Encoding UTF8
    
    Write-Success "Report saved to: $ReportPath"
    if ($PSVersionTable.Platform -ne 'Unix') {
        Start-Process notepad $ReportPath
    }
}

# ============================================
# 5. Remove console.log statements
# ============================================
function Remove-ConsoleLogs {
    Write-Warning "This will remove console.log statements. Creating backups first..."
    
    # Create backup directory
    $BackupDir = Join-Path $ScriptDir 'backup' "console_cleanup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    $Files = Get-ChildItem -Path $FrontendSrc -Recurse -Include '*.jsx', '*.js'
    
    foreach ($file in $Files) {
        # Create backup
        $BackupFile = Join-Path $BackupDir $file.Name
        Copy-Item -Path $file.FullName -Destination $BackupFile
        
        # Remove console.log
        $content = Get-Content -Path $file.FullName -Raw
        $newContent = $content -replace '^\s*console\.\s*\(\w+\).*\n?', ''
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
    }
    
    Write-Success "Backups created in: $BackupDir"
    Write-Success "Removed console.log statements"
}

# ============================================
# 6. Restore from backup
# ============================================
function Restore-Backup {
    Write-Info "Available backups:"
    $BackupDirs = Get-ChildItem -Path (Join-Path $ScriptDir 'backup') -Directory -ErrorAction SilentlyContinue
    
    if (-not $BackupDirs) {
        Write-Warning "No backups found"
        return
    }
    
    $BackupDirs | ForEach-Object { Write-Host "  📁 $($_.Name)" }
    
    $Selection = Read-Host "Enter backup directory name to restore"
    $BackupPath = Join-Path $ScriptDir 'backup' $Selection
    
    if (Test-Path $BackupPath) {
        Get-ChildItem -Path $BackupPath -File | ForEach-Object {
            $TargetFile = Join-Path $FrontendSrc $_.Name
            Copy-Item -Path $_.FullName -Destination $TargetFile -Force
        }
        Write-Success "Restore complete"
    } else {
        Write-Error "Backup not found"
    }
}

# ============================================
# 7. Run ESLint
# ============================================
function Run-ESLint {
    Write-Info "Running ESLint..."
    
    try {
        npm run lint -- "$FrontendSrc"
        Write-Success "ESLint passed"
    } catch {
        Write-Warning "ESLint issues found"
        Write-Host $_
    }
}

# ============================================
# 8. Full cleanup pipeline
# ============================================
function Run-FullCleanup {
    Write-Info "Running full cleanup pipeline..."
    Find-ConsoleLogs
    Write-Host "`n"
    Find-UseEffectIssues
    Write-Host "`n"
    Find-MissingKeys
    Write-Host "`n"
    Generate-Report
}

# ============================================
# Show Menu
# ============================================
function Show-Menu {
    Clear-Host
    Write-Host "🧹 Code Cleanup Script (PowerShell Edition)" -ForegroundColor Cyan
    Write-Host "================================================`n"
    
    Write-Host "1) Find console.log instances"
    Write-Host "2) Find useEffect issues"
    Write-Host "3) Find missing keys in maps"
    Write-Host "4) Generate cleanup report"
    Write-Host "5) Remove console.log (with backup)"
    Write-Host "6) Restore from backup"
    Write-Host "7) Run ESLint checks"
    Write-Host "8) Full cleanup pipeline"
    Write-Host "q) Quit"
    Write-Host ""
}

# ============================================
# Execute
# ============================================
switch ($Action) {
    'find-console' { Find-ConsoleLogs }
    'find-useeffect' { Find-UseEffectIssues }
    'find-keys' { Find-MissingKeys }
    'report' { Generate-Report }
    'remove' { Remove-ConsoleLogs }
    'restore' { Restore-Backup }
    'eslint' { Run-ESLint }
    'full' { Run-FullCleanup }
    'menu' {
        while ($true) {
            Show-Menu
            $Choice = Read-Host "Choose option [1-8, q]"
            
            switch ($Choice) {
                '1' { Find-ConsoleLogs }
                '2' { Find-UseEffectIssues }
                '3' { Find-MissingKeys }
                '4' { Generate-Report }
                '5' { Remove-ConsoleLogs }
                '6' { Restore-Backup }
                '7' { Run-ESLint }
                '8' { Run-FullCleanup }
                'q' { Write-Host "Goodbye!"; exit }
                default { Write-Warning "Invalid option" }
            }
            
            Write-Host "`nPress Enter to continue..."
            Read-Host
        }
    }
    default {
        Write-Host "Usage: .\cleanup.ps1 -Action <action>"
        Write-Host ""
        Write-Host "Available actions:"
        Write-Host "  find-console    - Find console.log instances"
        Write-Host "  find-useeffect  - Find useEffect issues"
        Write-Host "  find-keys       - Find missing keys in maps"
        Write-Host "  report          - Generate cleanup report"
        Write-Host "  remove          - Remove console.log (with backup)"
        Write-Host "  restore         - Restore from backup"
        Write-Host "  eslint          - Run ESLint checks"
        Write-Host "  full            - Run full cleanup pipeline"
        Write-Host "  menu            - Interactive menu (default)"
    }
}
