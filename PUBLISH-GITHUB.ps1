param([string]$Name = 'combat-robot-arena', [Parameter(Mandatory=$true)][string]$ZipPath, [switch]$Public)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
function Run([string]$Tool, [string[]]$Arguments) {
    & $Tool @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Tool failed with exit code $LASTEXITCODE" }
}
Get-Command git -ErrorAction Stop | Out-Null
Get-Command gh -ErrorAction Stop | Out-Null
if (!(Test-Path -LiteralPath $ZipPath -PathType Leaf)) { throw 'The offline ZIP does not exist.' }
$ZipPath = (Resolve-Path -LiteralPath $ZipPath).Path
if ($Name -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') { throw 'Use a repository name, without an owner or URL.' }
Run 'gh' @('auth','status')
$Owner = (& gh api user --jq .login).Trim()
if ($LASTEXITCODE -ne 0 -or !$Owner) { throw 'Cannot read the signed-in GitHub account.' }
$Repo = "$Owner/$Name"
$RepoUrl = "https://github.com/$Repo.git"
if (!(Test-Path .git)) { Run 'git' @('init','-b','main') }
$Root = (& git rev-parse --show-toplevel).Trim()
if ((Resolve-Path $Root).Path -ne (Resolve-Path $PSScriptRoot).Path) { throw 'The current folder is not the Git repository root.' }
$Remote = (& git remote get-url origin 2>$null)
if ($LASTEXITCODE -eq 0 -and $Remote.Trim() -notin @($RepoUrl,"git@github.com:$Repo.git")) { throw 'origin points to a different repository. Resolve it before publishing.' }
$HasRemote = $LASTEXITCODE -eq 0
& gh repo view $Repo --json name *> $null
$Exists = $LASTEXITCODE -eq 0
if ($Exists -and !$HasRemote) { throw "$Repo already exists. Connect the intended checkout before publishing." }
Run 'git' @('add','--all')
& git diff --cached --quiet
if ($LASTEXITCODE -eq 1) { Run 'git' @('commit','-m','Prepare complete offline Combat Robot Arena handover') }
elseif ($LASTEXITCODE -ne 0) { throw 'Cannot inspect staged changes.' }
if (!$Exists) {
    $Visibility = if ($Public) { '--public' } else { '--private' }
    Run 'gh' @('repo','create',$Repo,$Visibility,'--source','.','--remote','origin','--push')
} else { Run 'git' @('push','-u','origin','HEAD') }
$Tag = 'offline-' + (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
Run 'gh' @('release','create',$Tag,$ZipPath,'--repo',$Repo,'--title','Complete offline Codex development package','--notes-file','handover/RELEASE_NOTES.md')
Write-Host "Published https://github.com/$Repo and release $Tag"
