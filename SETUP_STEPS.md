# Ruby 설치 후 다음 단계

## 1. Bundler 설치 (진행 중)
```powershell
gem install bundler
```

## 2. Jekyll 의존성 설치
블로그 디렉토리에서 실행:
```powershell
bundle install
```
이 명령어는 `Gemfile`에 있는 모든 필요한 gem들을 설치합니다.

## 3-A. 로컬에서 미리보기 (선택사항)
```powershell
bundle exec jekyll serve
```
- 브라우저에서 `http://localhost:4000` 접속
- 변경사항을 실시간으로 확인 가능
- 서버 중지: `Ctrl + C`

## 3-B. GitHub에 배포하기
로컬 미리보기 없이 바로 배포하려면:
```powershell
git add .
git commit -m "블로그 설정 업데이트"
git push origin main
```
또는 배포 스크립트 사용:
```powershell
.\deploy.ps1
```

## 체크리스트
- [ ] Ruby 설치 완료
- [ ] `gem install bundler` 실행 완료
- [ ] `bundle install` 실행 완료
- [ ] (선택) `bundle exec jekyll serve`로 로컬 확인
- [ ] `git push`로 배포

## 문제 해결
- `bundle install` 에러 시: PowerShell을 관리자 권한으로 실행
- 포트 4000이 이미 사용 중: `bundle exec jekyll serve --port 4001` 사용
- 변경사항이 안 보일 때: 브라우저 캐시 삭제 (Ctrl + Shift + R)

