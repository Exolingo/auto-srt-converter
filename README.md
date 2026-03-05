# Auto SRT Converter

한국어 뮤직비디오 MP3를 업로드하면 자동으로 자막 파일(.srt)을 생성합니다.

## 기능

- **음성 인식**: OpenAI Whisper로 타임스탬프 추출
- **AI 협업 분석**: Gemini가 오디오를 직접 청취하여 가사 교정 → 두 AI 결과 교차 검증
- **한/영 번역**: 교정된 한국어 가사를 영어로 자동 번역
- **감정 분석**: 세그먼트별 감정 분류 및 신뢰도 표시
- **직접 편집**: 분석 결과를 웹에서 바로 수정, 개별 재번역 가능
- **SRT 다운로드**: 편집 프로그램 바로 사용 가능한 형식으로 저장

## 사용 방법

1. 비밀번호 입력 후 접속
2. MP3 파일 드래그 앤 드롭
3. Whisper + Gemini 자동 분석 대기 (약 30~60초)
4. 결과 확인 후 필요한 구간 수정
5. SRT 다운로드

## 로컬 개발 환경

```bash
# 1. 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일에 API 키 입력

# 2. 의존성 설치 및 실행
npm install
npm run dev
```

### 필요한 환경변수

| 변수 | 설명 | 발급처 |
|---|---|---|
| `VITE_APP_PASSWORD` | 앱 접근 비밀번호 | 직접 설정 |
| `VITE_OPENAI_API_KEY` | Whisper 음성 인식 | [platform.openai.com](https://platform.openai.com/api-keys) |
| `VITE_GEMINI_API_KEY` | Gemini 번역/분석 | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

## Vercel 배포

1. GitHub 레포지토리에 push
2. Vercel에서 프로젝트 연결 (Framework: Vite 자동 감지)
3. Settings → Environment Variables에 위 3개 변수 입력
4. Deploy

> MP3 파일은 브라우저에서 OpenAI로 직접 전송되므로 Vercel 업로드 제한과 무관합니다.

## 기술 스택

- React + Vite + TypeScript
- Tailwind CSS
- OpenAI Whisper API
- Google Gemini 2.5 Flash API
