# Doc Assistant React 예제

Doc Assistant API를 사용하는 간단한 React 예제입니다.

## 설치

```bash
pnpm install
```

## 개발 서버 실행

```bash
pnpm dev
```

## 빌드

```bash
pnpm build
```

## 환경 변수 설정

프로젝트는 환경별로 다른 설정을 사용할 수 있습니다. Vite는 다음 순서로 환경 변수를 로드합니다:

1. `.env` - 모든 환경에서 로드
2. `.env.local` - 모든 환경에서 로드 (git에 무시됨, **가장 높은 우선순위**)
3. `.env.[mode]` - 특정 모드에서만 로드 (예: `.env.development`)
4. `.env.[mode].local` - 특정 모드에서만 로드, git에 무시됨

**중요**: `pnpm dev` 실행 시 `development` 모드로 실행되므로, `.env.development`가 있으면 `.env.local`보다 나중에 로드되어 덮어씁니다. 로컬 개발 시에는 `.env.local`만 사용하는 것을 권장합니다.

### 로컬 개발 환경 설정

`.env.local` 파일을 생성하거나 `.env.example`을 복사하여 사용하세요:

```bash
cp .env.example .env.local
```

`.env.local` 파일 내용:
```
VITE_API_BASE_URL=http://localhost:3000
```

**참고**: 로컬 개발 시 `.env.development` 파일이 있으면 `.env.local`의 설정이 덮어써질 수 있으므로, 로컬 개발용 설정은 `.env.local`에만 작성하세요.

### 프로덕션 환경 설정

`.env.production` 파일을 수정하세요:
```
VITE_API_BASE_URL=https://api.example.com
```

**참고**: `.env.local`, `.env.*.local` 파일은 `.gitignore`에 포함되어 git에 커밋되지 않습니다.

## 인증 토큰 설정

기본적으로 더미 토큰(`dummy-auth-token-12345`)이 사용됩니다. 실제 토큰을 사용하려면 다음 방법 중 하나를 사용하세요:

### 방법 1: 환경 변수 사용 (권장)

`.env.local` 파일에 추가:
```
VITE_AUTH_TOKEN=your-actual-token-here
```

### 방법 2: localStorage 사용

브라우저 개발자 도구 콘솔에서:
```javascript
localStorage.setItem('authToken', 'your-token-here');
```

**우선순위**: 환경 변수 > localStorage > 더미 토큰

## 사용 방법

1. 개발 서버를 실행합니다 (`pnpm dev`)
2. 브라우저에서 애플리케이션을 엽니다
3. PDF 파일을 업로드합니다
4. 질문을 입력하고 응답을 받습니다

## 주요 기능

- 세션 자동 생성
- PDF 파일 업로드 (최대 10개)
- RAG 기반 질의 및 응답
- 대화 히스토리 유지

