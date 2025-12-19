# Ruby 및 Bundler 설치 스크립트
# Windows에서 Ruby를 설치하는 방법을 안내합니다.

Write-Host "=== Ruby & Bundler 설치 가이드 ===" -ForegroundColor Cyan
Write-Host ""

# Chocolatey 설치 여부 확인
Write-Host "1. Chocolatey 설치 확인 중..." -ForegroundColor Yellow
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    Write-Host "✓ Chocolatey가 설치되어 있습니다." -ForegroundColor Green
    Write-Host ""
    Write-Host "Chocolatey로 Ruby를 설치하시겠습니까? (y/n)" -ForegroundColor Yellow
    $installChoco = Read-Host
    
    if ($installChoco -eq "y" -or $installChoco -eq "Y") {
        Write-Host ""
        Write-Host "Ruby 설치 중... (관리자 권한이 필요할 수 있습니다)" -ForegroundColor Yellow
        Write-Host "명령어: choco install ruby -y" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "PowerShell을 관리자 권한으로 실행한 후 다음 명령어를 실행하세요:" -ForegroundColor Yellow
        Write-Host "choco install ruby -y" -ForegroundColor White
        Write-Host ""
        Write-Host "설치 후 PowerShell을 재시작하고 다음 명령어로 확인:" -ForegroundColor Yellow
        Write-Host "ruby --version" -ForegroundColor White
        Write-Host "gem install bundler" -ForegroundColor White
    }
} else {
    Write-Host "Chocolatey가 설치되어 있지 않습니다." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "=== 설치 방법 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "방법 1: RubyInstaller 사용 (추천)" -ForegroundColor Green
Write-Host "1. https://rubyinstaller.org/ 접속" -ForegroundColor White
Write-Host "2. 'Ruby+Devkit 3.3.x (x64)' 다운로드" -ForegroundColor White
Write-Host "3. 설치 프로그램 실행" -ForegroundColor White
Write-Host "4. 설치 완료 후 PowerShell 재시작" -ForegroundColor White
Write-Host "5. 다음 명령어 실행:" -ForegroundColor White
Write-Host "   gem install bundler" -ForegroundColor Cyan
Write-Host ""
Write-Host "방법 2: Chocolatey 사용" -ForegroundColor Green
Write-Host "1. PowerShell을 관리자 권한으로 실행" -ForegroundColor White
Write-Host "2. Chocolatey 설치 (아직 없다면):" -ForegroundColor White
Write-Host "   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" -ForegroundColor Cyan
Write-Host "3. Ruby 설치:" -ForegroundColor White
Write-Host "   choco install ruby -y" -ForegroundColor Cyan
Write-Host "4. PowerShell 재시작 후:" -ForegroundColor White
Write-Host "   gem install bundler" -ForegroundColor Cyan
Write-Host ""
Write-Host "방법 3: winget 사용 (Windows 10/11)" -ForegroundColor Green
Write-Host "1. PowerShell에서 실행:" -ForegroundColor White
Write-Host "   winget install RubyInstallerTeam.Ruby.3.3" -ForegroundColor Cyan
Write-Host "2. PowerShell 재시작 후:" -ForegroundColor White
Write-Host "   gem install bundler" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== 설치 확인 ===" -ForegroundColor Cyan
Write-Host "설치 후 다음 명령어로 확인하세요:" -ForegroundColor Yellow
Write-Host "ruby --version" -ForegroundColor White
Write-Host "gem --version" -ForegroundColor White
Write-Host "bundler --version" -ForegroundColor White
Write-Host ""
Write-Host "=== Jekyll 로컬 서버 실행 ===" -ForegroundColor Cyan
Write-Host "설치 완료 후 블로그 디렉토리에서:" -ForegroundColor Yellow
Write-Host "bundle install" -ForegroundColor White
Write-Host "bundle exec jekyll serve" -ForegroundColor White
Write-Host ""
Write-Host "그 후 브라우저에서 http://localhost:4000 접속" -ForegroundColor Cyan
Write-Host ""
Write-Host "참고: 로컬 서버는 선택사항입니다." -ForegroundColor Yellow
Write-Host "GitHub Actions로 자동 배포되므로 Ruby 없이도 git push만으로 배포 가능합니다!" -ForegroundColor Green
Write-Host ""









