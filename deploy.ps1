# GitHub 블로그 배포 스크립트
# PowerShell에서 실행: .\deploy.ps1

Write-Host "=== GitHub 블로그 배포 스크립트 ===" -ForegroundColor Cyan
Write-Host ""

# Git 상태 확인
Write-Host "1. Git 상태 확인 중..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "변경된 파일:" -ForegroundColor Green
    git status --short
    Write-Host ""
    
    # 커밋 메시지 입력 받기
    $commitMessage = Read-Host "커밋 메시지를 입력하세요 (기본값: Update blog)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Update blog"
    }
    
    Write-Host ""
    Write-Host "2. 변경사항 스테이징 중..." -ForegroundColor Yellow
    git add .
    
    Write-Host "3. 커밋 중..." -ForegroundColor Yellow
    git commit -m $commitMessage
    
    Write-Host "4. GitHub에 푸시 중..." -ForegroundColor Yellow
    git push origin main
    
    Write-Host ""
    Write-Host "✓ 배포 완료!" -ForegroundColor Green
    Write-Host "몇 분 후 https://sghtao.github.io 에서 확인하세요." -ForegroundColor Cyan
} else {
    Write-Host "변경된 파일이 없습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "강제로 푸시하시겠습니까? (y/n)" -ForegroundColor Yellow
    $force = Read-Host
    if ($force -eq "y" -or $force -eq "Y") {
        Write-Host "GitHub에 푸시 중..." -ForegroundColor Yellow
        git push origin main
        Write-Host "✓ 푸시 완료!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== 완료 ===" -ForegroundColor Cyan

