# 블로그 커스터마이징 가이드

## Git Push 워크플로우

이 블로그는 GitHub Actions를 통해 자동 배포됩니다. 다음과 같이 작동합니다:

1. **로컬에서 변경사항 작성/수정**
2. **Git에 커밋**: `git add .` → `git commit -m "메시지"`
3. **GitHub에 푸시**: `git push origin main`
4. **자동 배포**: GitHub Actions가 자동으로 빌드하고 배포합니다
5. **블로그 확인**: 몇 분 후 `https://sghtao.github.io`에서 확인 가능

## 주요 설정 파일 커스터마이징

### 1. `_config.yml` - 메인 설정 파일

#### 기본 정보 수정
```yaml
# 블로그 제목
title: Chirpy  # 원하는 제목으로 변경

# 부제목
tagline: A text-focused Jekyll theme  # 원하는 부제목으로 변경

# 설명 (SEO에 사용됨)
description: >-
  A minimal, responsive and feature-rich Jekyll theme for technical writing.

# 사이트 URL (반드시 수정 필요!)
url: "https://sghtao.github.io"  # 본인의 GitHub Pages URL로 변경

# GitHub 사용자명
github:
  username: sghtao  # 본인의 GitHub 사용자명으로 변경
```

#### 소셜 미디어 설정
```yaml
social:
  name: your_full_name  # 본인의 이름으로 변경
  email: example@domain.com  # 본인의 이메일로 변경
  links:
    - https://twitter.com/username  # Twitter 링크 (없으면 삭제)
    - https://github.com/sghtao  # GitHub 링크
    # - https://www.facebook.com/username  # 주석 해제하여 추가
    # - https://www.linkedin.com/in/username  # LinkedIn 등 추가 가능
```

#### 언어 및 시간대 설정
```yaml
# 언어 설정 (한국어로 변경하려면)
lang: ko  # 또는 en, ja, zh-CN 등

# 시간대 설정
timezone: Asia/Seoul  # 한국 시간대
```

#### 테마 모드 설정
```yaml
# 테마 색상 모드
theme_mode: light  # light, dark, 또는 비워두면 시스템 설정 따름
```

#### 아바타 설정
```yaml
# 사이드바 아바타 이미지
avatar: /assets/img/avatar.png  # 프로필 이미지 경로
```

#### 댓글 시스템 설정
```yaml
comments:
  provider: giscus  # disqus, utterances, giscus 중 선택
  # Giscus 설정 (추천)
  giscus:
    repo: sghtao/sghtao.github.io  # 본인의 저장소
    repo_id:  # Giscus에서 발급받은 ID
    category: Announcements
    category_id:  # Giscus에서 발급받은 ID
```

#### 분석 도구 설정
```yaml
# Google Analytics
analytics:
  google:
    id: G-XXXXXXXXXX  # Google Analytics ID
```

### 2. `_data/contact.yml` - 연락처 아이콘 설정

사이드바에 표시될 연락처 아이콘을 설정합니다:

```yaml
- type: github
  icon: "fab fa-github"
  url: https://github.com/sghtao  # 본인의 GitHub 링크

- type: email
  icon: "fas fa-envelope"
  noblank: true
  url: mailto:your-email@example.com  # 본인의 이메일
```

### 3. `_tabs/about.md` - About 페이지

블로그의 "About" 페이지 내용을 작성합니다. Markdown 형식으로 작성하면 됩니다.

### 4. `_posts/` - 블로그 포스트 작성

새 포스트를 작성하려면 `_posts/` 폴더에 다음 형식으로 파일을 만듭니다:

```
_posts/YYYY-MM-DD-포스트-제목.md
```

예시:
```markdown
---
title: "첫 번째 포스트"
date: 2025-01-27
categories: [일반]
tags: [블로그, 시작]
---

여기에 포스트 내용을 작성합니다.
```

## 빠른 시작 명령어

### Windows PowerShell에서 사용할 수 있는 명령어들:

```powershell
# 변경사항 확인
git status

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "설정 변경"

# GitHub에 푸시 (자동 배포 시작)
git push origin main

# 또는 한 번에 실행
git add . && git commit -m "변경사항" && git push origin main
```

## 로컬에서 미리보기 (선택사항)

로컬에서 Jekyll을 실행하여 변경사항을 미리 볼 수 있습니다:

```powershell
# Ruby와 Bundler 설치 필요 (이미 설치되어 있다면 생략)
# 1. Ruby 설치: https://rubyinstaller.org/
# 2. Bundler 설치: gem install bundler

# 의존성 설치
bundle install

# 로컬 서버 실행
bundle exec jekyll serve

# 브라우저에서 http://localhost:4000 접속
```

## 주의사항

1. **`url` 설정은 반드시 수정해야 합니다** - 그렇지 않으면 링크가 제대로 작동하지 않습니다.
2. **GitHub Pages 설정 확인**: 저장소 Settings → Pages에서 소스가 "GitHub Actions"로 설정되어 있는지 확인하세요.
3. **첫 배포는 시간이 걸릴 수 있습니다** - 보통 5-10분 정도 소요됩니다.
4. **포스트 작성 시 날짜 형식**: 파일명과 front matter의 date가 일치해야 합니다.

## 유용한 링크

- [Chirpy 테마 공식 문서](https://github.com/cotes2020/jekyll-theme-chirpy/wiki)
- [Jekyll 공식 문서](https://jekyllrb.com/docs/)
- [Markdown 가이드](https://www.markdownguide.org/)



