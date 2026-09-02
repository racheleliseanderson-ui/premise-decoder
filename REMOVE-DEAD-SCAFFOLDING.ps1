<#
  Spa Intelligence — remove dead scaffolding.

  The bridge that wrote the rest of this refactor cannot delete files, so the
  deletions are here, in a script you run once and then delete.

  WHY EACH GROUP GOES
  -------------------
  1. src/components/ui/  (45 files, ~130 KB)
     The generator's component library. Every panel on this desk is written by
     hand against src/components/desk/ui.tsx. Nothing imports these. They
     survived only because eslint.config.js had `no-unused-vars` switched OFF,
     which is now switched back on — so leaving them would turn CI red rather
     than keep anything working.

  2. src/hooks/use-mobile.tsx, src/lib/utils.ts
     The two helpers those components pulled in. `cn()` in lib/utils.ts has no
     remaining caller; the desk uses template strings.

  3. src/lib/i18n.ts, src/lib/lang-context.tsx
     A language switcher that was never wired to a control and translated a
     fraction of one panel. A half-translated legal-adjacent desk is worse than
     an English one; the honest fix is to remove it and ship a real translation
     later if it is ever wanted.

  4. components.json
     Config for the generator that produced group 1. It only tells that tool
     where to write more of them.

  5. setting-analyst/  (~180 KB)
     An entire earlier implementation of this app, committed alongside the
     live one. It is not built, not imported, and not routed. It is the single
     biggest source of "which file is real?" in the repository.

  WHAT THIS SCRIPT DOES NOT TOUCH
  -------------------------------
  src/assets/*.jpg — your images. Untouched, and still imported.

  HOW TO RUN IT
  -------------
  Open PowerShell, then:

      cd C:\Users\a126366\Documents\GitHub\premise-decoder
      powershell -ExecutionPolicy Bypass -File .\REMOVE-DEAD-SCAFFOLDING.ps1

  It uses `git rm`, so every deletion lands staged and shows in your diff
  before you commit anything. Nothing is pushed.
#>

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path (Join-Path $root ".git"))) {
  Write-Host "Not a git repository: $root" -ForegroundColor Red
  Write-Host "Run this from inside premise-decoder." -ForegroundColor Red
  exit 1
}

$targets = @(
  "src/components/ui",
  "src/hooks",
  "src/lib/utils.ts",
  "src/lib/i18n.ts",
  "src/lib/lang-context.tsx",
  "components.json",
  "setting-analyst"
)

Write-Host ""
Write-Host "About to remove from $root :" -ForegroundColor Cyan
$present = @()
foreach ($t in $targets) {
  $p = Join-Path $root ($t -replace "/", "\")
  if (Test-Path $p) {
    $present += $t
    Write-Host "  - $t"
  } else {
    Write-Host "  - $t  (already gone, skipping)" -ForegroundColor DarkGray
  }
}

if ($present.Count -eq 0) {
  Write-Host ""
  Write-Host "Nothing left to remove." -ForegroundColor Green
  exit 0
}

Write-Host ""
$answer = Read-Host "Type 'yes' to stage these deletions"
if ($answer -ne "yes") {
  Write-Host "Nothing was changed." -ForegroundColor Yellow
  exit 0
}

foreach ($t in $present) {
  Write-Host "Removing $t ..."
  # -r for directories, --ignore-unmatch so an untracked path is not fatal.
  & git rm -r --quiet --ignore-unmatch -- $t
  # git rm leaves untracked files behind; clear anything that remains.
  $p = Join-Path $root ($t -replace "/", "\")
  if (Test-Path $p) { Remove-Item -Recurse -Force $p }
}

Write-Host ""
Write-Host "Done. The deletions are staged, not committed." -ForegroundColor Green
Write-Host ""
Write-Host "Now check the build before you commit anything:" -ForegroundColor Cyan
Write-Host "    bun install       # package.json lost 43 dependencies; refresh bun.lock"
Write-Host "    bun run typecheck"
Write-Host "    bun run lint"
Write-Host "    bun run test"
Write-Host "    bun run build"
Write-Host ""
Write-Host "Then review with 'git status' and 'git diff --cached --stat'."
Write-Host "You can delete this script afterwards."
