# ⛳ 파크골프 점수판 PWA

파크골프 점수를 기록하고 실시간 랭킹을 확인할 수 있는 PWA(Progressive Web App)입니다.

## ✨ 주요 기능

- **📝 점수 입력**: 선수별 홀별 점수 기록
- **🏆 실시간 랭킹**: 자동 순위 계산 및 표시
- **📺 전광판 모드**: 대형 디스플레이용 화면
- **📴 오프라인 지원**: 인터넷 없이도 완벽하게 작동
- **📱 앱 설치**: 홈 화면에 추가하여 앱처럼 사용

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 3. 프로덕션 빌드

```bash
npm run build
```

### 4. 빌드 미리보기

```bash
npm run preview
```

## 📁 프로젝트 구조

```
park-golf-pwa/
├── public/
│   └── favicon.svg          # 파비콘
├── src/
│   ├── App.jsx              # 메인 앱 컴포넌트
│   ├── main.jsx             # React 진입점
│   └── index.css            # 전역 스타일
├── index.html               # HTML 템플릿
├── vite.config.js           # Vite + PWA 설정
├── tailwind.config.js       # Tailwind CSS 설정
├── postcss.config.js        # PostCSS 설정
├── package.json             # 의존성 및 스크립트
└── README.md                # 이 파일
```

## 🌐 배포하기

### Vercel (추천)

1. [Vercel](https://vercel.com)에 가입
2. GitHub에 이 프로젝트 푸시
3. Vercel에서 Import 후 자동 배포

```bash
# Vercel CLI 사용 시
npm i -g vercel
vercel
```

### Netlify

1. [Netlify](https://netlify.com)에 가입
2. `npm run build` 실행
3. `dist` 폴더를 Netlify에 드래그 앤 드롭

### GitHub Pages

```bash
npm run build
# dist 폴더를 gh-pages 브랜치에 배포
```

## 📱 PWA 설치 방법

### Android (Chrome)
1. 사이트 접속
2. 브라우저 메뉴 (⋮) 클릭
3. "홈 화면에 추가" 또는 "앱 설치" 선택

### iOS (Safari)
1. 사이트 접속
2. 공유 버튼 (↑) 클릭
3. "홈 화면에 추가" 선택

### Desktop (Chrome/Edge)
1. 사이트 접속
2. 주소창 오른쪽 설치 아이콘 클릭
3. "설치" 클릭

## 🎨 커스터마이징

### 홀 수 및 파 변경

`src/App.jsx` 상단의 설정값 수정:

```javascript
const HOLES = 9;  // 홀 수
const PAR = [3, 4, 3, 4, 5, 3, 4, 3, 4];  // 각 홀별 파
```

### 테마 색상 변경

`tailwind.config.js`에서 색상 커스터마이징

## 🔧 기술 스택

- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **vite-plugin-pwa** - PWA 지원
- **Workbox** - 서비스 워커 & 캐싱

## 📄 라이선스

MIT License

## 🙋 문의

문제가 있거나 기능 제안이 있으시면 이슈를 등록해주세요!
