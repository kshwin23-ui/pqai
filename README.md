# PQAI — 나만의 AI 웹사이트

밝은 테마의 한국어 AI 웹앱 스타터입니다. AI 대화, 웹 검색 기반 학습, 코딩, 글쓰기/번역, 이미지 생성, 브라우저 내 대화 기록을 포함합니다.

## 필요한 것

- Node.js 20 이상
- OpenAI API 키 및 API 사용 권한/결제 설정
- 최신 Chrome, Edge, Firefox 또는 Safari

## 로컬에서 실행

1. 압축 파일을 풀고 터미널에서 `pqai` 폴더로 이동합니다.
2. 의존성을 설치합니다.

   ```bash
   npm install
   ```

3. `.env.example`을 `.env`로 복사합니다.
   - macOS/Linux: `cp .env.example .env`
   - Windows PowerShell: `Copy-Item .env.example .env`
4. `.env` 파일을 열어 `OPENAI_API_KEY`에 본인의 키를 입력합니다. 키를 HTML 파일에 넣거나 다른 사람과 공유하지 마세요.
5. 실행합니다.

   ```bash
   npm start
   ```

6. 브라우저에서 `http://localhost:3000`을 엽니다.

## 기능

- **AI 대화:** OpenAI Responses API로 답변을 생성합니다.
- **지식 탐색:** 웹 검색 토글을 켜면 Responses API의 `web_search` 도구를 사용할 수 있습니다.
- **코딩 / 글쓰기:** 모드별 지침을 AI에 전달합니다.
- **이미지 생성:** 이미지 설명을 `/api/image`에 보내 생성한 이미지를 표시하고 저장할 수 있습니다.
- **대화 기록:** 최대 40개 대화를 현재 브라우저의 `localStorage`에 저장합니다. 다른 기기와 자동 동기화되지 않으며 브라우저 데이터를 지우면 사라집니다.

## 배포 (Render 예시)

1. 프로젝트를 GitHub 저장소에 올립니다. `.env` 파일은 절대로 커밋하지 마세요.
2. Render에서 **New + → Web Service**를 선택하고 저장소를 연결합니다.
3. Runtime은 Node, Build Command는 `npm install`, Start Command는 `npm start`로 설정합니다.
4. 서비스의 Environment 설정에서 `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`을 추가합니다.
5. 배포가 완료되면 제공된 HTTPS 주소로 접속합니다.

다른 Node.js 호스팅 서비스에서도 동일하게 Node 20+, `npm install`, `npm start`, 환경 변수 설정이 필요합니다.

## 설정

- `OPENAI_MODEL`: 계정에서 사용 가능한 Responses API 모델 이름
- `OPENAI_IMAGE_MODEL`: 계정에서 사용 가능한 이미지 생성 모델 이름
- `PORT`: 서버 포트 (호스팅 환경에서 자동 지정되는 경우가 많음)

기본 모델 이름이 계정에서 지원되지 않으면 `.env`에서 사용 가능한 모델로 변경하세요.

## 운영 전에 꼭 보완할 점

이 프로젝트는 실행 가능한 출발점이며, 대규모 공개 서비스용으로 보안/운영 기능을 모두 갖춘 제품은 아닙니다.

- 로그인 및 서버 측 대화 저장이 없습니다. 기록은 사용자 브라우저에만 저장됩니다.
- 공개 배포 전 로그인, 요청 속도 제한, 사용량/비용 한도, 입력 크기 제한, 오류 로깅, 개인정보 처리방침을 추가하세요.
- API 키는 서버 환경 변수에만 보관하세요. 프런트엔드 JavaScript에 키를 넣으면 노출됩니다.
- 이미지 생성 및 웹 검색에는 API 사용 요금/한도가 적용될 수 있습니다.
- 대화 기록은 브라우저 로컬 저장소에 저장되므로 공용 PC에서는 주의하세요.

## 공식 문서

- OpenAI API 빠른 시작: https://developers.openai.com/api/docs/quickstart
- Responses API 웹 검색: https://developers.openai.com/api/docs/guides/tools-web-search
- 이미지 생성 API: https://developers.openai.com/api/docs/guides/image-generation
