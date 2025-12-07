# 빠른 시작 가이드

## 첫 번째 배포하기

### 1. 기본 설정 수정

`_config.yml` 파일을 열어서 다음 항목들을 수정하세요:

```yaml
title: "내 블로그 제목"  # 라인 17
tagline: "블로그 부제목"  # 라인 19
url: "https://sghtao.github.io"  # 라인 26 (반드시 수정!)
github:
  username: sghtao  # 라인 29
social:
  name: "본인 이름"  # 라인 37
  email: "본인@이메일.com"  # 라인 38
```

### 2. 배포하기

#### 방법 1: PowerShell 스크립트 사용 (추천)
```powershell
.\deploy.ps1
```

#### 방법 2: 수동으로 명령어 실행
```powershell
git add .
git commit -m "초기 설정 완료"
git push origin main
```

### 3. 배포 확인

1. GitHub 저장소의 **Actions** 탭에서 빌드 상태 확인
2. 빌드가 완료되면 (보통 5-10분) `https://sghtao.github.io` 접속
3. 블로그가 정상적으로 표시되는지 확인

## 첫 번째 포스트 작성하기

1. `_posts` 폴더에 새 파일 생성
   - 파일명 형식: `2025-01-27-첫-포스트.md`

2. 파일 내용 예시:
```markdown
---
title: "첫 번째 포스트"
date: 2025-01-27
categories: [일반]
tags: [블로그]
---

안녕하세요! 첫 번째 포스트입니다.
```

3. 배포:
```powershell
.\deploy.ps1
```

## 자주 사용하는 명령어

```powershell
# 상태 확인
git status

# 변경사항 추가 및 커밋
git add .
git commit -m "변경 내용 설명"

# 배포
git push origin main

# 또는 한 번에
git add . && git commit -m "변경 내용" && git push origin main
```

## 문제 해결

### 배포가 안 될 때
1. GitHub 저장소의 **Settings** → **Pages** 확인
2. Source가 "GitHub Actions"로 설정되어 있는지 확인
3. Actions 탭에서 에러 메시지 확인

### 로컬에서 미리보고 싶을 때
```powershell
bundle install
bundle exec jekyll serve
```
그 후 브라우저에서 `http://localhost:4000` 접속

더 자세한 내용은 `CUSTOMIZATION_GUIDE.md`를 참고하세요!



