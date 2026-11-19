# GitHubで新規の「空の」リポジトリを作成した後、PowerShellから実行してください。
# 使い方: powershell -ExecutionPolicy Bypass -File .\GitHubへ公開.ps1 -RepositoryUrl https://github.com/Penta2026/michinotochu.git
param([Parameter(Mandatory=$true)][string]$RepositoryUrl)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git for Windowsが見つかりません。インストールしてから再実行してください。' }
if ($RepositoryUrl -notmatch '^https://github\.com/[a-zA-Z0-9-]+/[a-zA-Z0-9_.-]+(\.git)?$') { throw 'GitHubのリポジトリURLを指定してください。' }
if (Test-Path .git) { throw '既存の.gitフォルダーがあります。誤上書きを避けるため中止しました。' }
& git init
if ($LASTEXITCODE -ne 0) { throw 'git init failed' }
& git branch -M main
& git add .
if ($LASTEXITCODE -ne 0) { throw 'git add failed' }
& git commit -m 'Initial PWA release from local Web 1.5.42-dev4 (DB 2.8.23)'
if ($LASTEXITCODE -ne 0) { throw 'git commit failed (git user.name/email may need configuration)' }
& git remote add origin $RepositoryUrl
if ($LASTEXITCODE -ne 0) { throw 'git remote failed' }
& git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'git push failed: verify repository, permissions and sign-in' }
Write-Host 'アップロード完了。GitHub Settings → Pages → Deploy from a branch → main / (root) を選択してください。'
