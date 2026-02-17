# PowerShell script to add dynamic rendering config to all admin pages
# This prevents build timeouts on Vercel

$adminPath = "c:\vasu\hardware_system\frontend\src\app\admin"
$configLines = @"

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
"@

# Find all page.tsx files in admin directory
$pageFiles = Get-ChildItem -Path $adminPath -Filter "page.tsx" -Recurse

Write-Host "Found $($pageFiles.Count) admin page files"
Write-Host ""

foreach ($file in $pageFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file already has the config
    if ($content -match "export const dynamic = 'force-dynamic'") {
        Write-Host "✓ Already configured: $($file.FullName.Replace($adminPath, ''))" -ForegroundColor Green
        continue
    }
    
    # Check if it's a client component
    if ($content -match "^[`"']use client[`"'];") {
        Write-Host "→ Adding config to: $($file.FullName.Replace($adminPath, ''))" -ForegroundColor Yellow
        
        # Find the position after imports (look for first interface, type, or export default)
        $insertPosition = $content.IndexOf("`r`ninterface ")
        if ($insertPosition -eq -1) {
            $insertPosition = $content.IndexOf("`r`nexport default")
        }
        if ($insertPosition -eq -1) {
            $insertPosition = $content.IndexOf("`r`ntype ")
        }
        
        if ($insertPosition -gt 0) {
            $newContent = $content.Insert($insertPosition, $configLines)
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "  ✓ Config added successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Could not find insertion point" -ForegroundColor Red
        }
    } else {
        Write-Host "○ Server component (no action needed): $($file.FullName.Replace($adminPath, ''))" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "Done! All admin pages have been configured for dynamic rendering." -ForegroundColor Green
Write-Host "You can now run 'npm run build' to test the build locally." -ForegroundColor Yellow
