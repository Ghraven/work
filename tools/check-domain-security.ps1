param(
    [string]$BaseUrl = "https://rollycalma.com"
)

$ErrorActionPreference = "Stop"

$paths = @(
    "/",
    "/arap/",
    "/webloom/",
    "/arap-demo/",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/.well-known/security.txt",
    "/script.js"
)

$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
    param([string]$Message)
    $script:failures.Add($Message) | Out-Null
    Write-Host "FAIL $Message" -ForegroundColor Red
}

function Assert-Match {
    param(
        [string]$Label,
        [string]$Content,
        [string]$Pattern
    )

    if ($Content -notmatch $Pattern) {
        Add-Failure "$Label missing pattern: $Pattern"
    } else {
        Write-Host "OK   $Label has $Pattern" -ForegroundColor Green
    }
}

Write-Host "Checking $BaseUrl" -ForegroundColor Cyan

foreach ($path in $paths) {
    $url = "$BaseUrl$path"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 25
        if ($response.StatusCode -ne 200) {
            Add-Failure "$url returned $($response.StatusCode)"
        } else {
            Write-Host "OK   $url -> 200" -ForegroundColor Green
        }
    } catch {
        Add-Failure "$url error: $($_.Exception.Message)"
    }
}

$root = (Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 25).Content
Assert-Match "root page" $root "Content-Security-Policy"
Assert-Match "root page" $root "strict-origin-when-cross-origin"
Assert-Match "root page" $root "https://rollycalma\.com/"

$securityTxt = (Invoke-WebRequest -Uri "$BaseUrl/.well-known/security.txt" -UseBasicParsing -TimeoutSec 25).Content
Assert-Match "security.txt" $securityTxt "Contact: mailto:rolly\.calma\.0217@gmail\.com"
Assert-Match "security.txt" $securityTxt "Canonical: https://rollycalma\.com/\.well-known/security\.txt"
Assert-Match "security.txt" $securityTxt "Expires: 2027-07-09T00:00:00Z"

$script = (Invoke-WebRequest -Uri "$BaseUrl/script.js" -UseBasicParsing -TimeoutSec 25).Content
Assert-Match "script.js" $script "hasConfiguredFormEndpoint"
Assert-Match "script.js" $script "openMailFallback"
Assert-Match "script.js" $script "!hasConfiguredFormEndpoint"

Write-Host ""
Write-Host "HTTP header snapshot. Blank values are expected on GitHub Pages unless Cloudflare/proxy is added later." -ForegroundColor Yellow
$headers = (Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 25).Headers
foreach ($header in @("Strict-Transport-Security", "Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy")) {
    Write-Host ("{0}: {1}" -f $header, $headers[$header])
}

try {
    $dns = Resolve-DnsName "rollycalma.com" -Type A
    $ips = @($dns | Where-Object { $_.IPAddress } | Select-Object -ExpandProperty IPAddress)
    foreach ($expected in @("185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153")) {
        if ($ips -notcontains $expected) {
            Add-Failure "DNS A record missing $expected"
        }
    }
    Write-Host "OK   DNS A records checked" -ForegroundColor Green
} catch {
    Add-Failure "DNS A lookup error: $($_.Exception.Message)"
}

if ($failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Domain security check failed:" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
    exit 1
}

Write-Host ""
Write-Host "Domain security check passed." -ForegroundColor Green

