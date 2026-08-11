# 민주로그 front

민주·인권·평화 장소 6곳 방문 → 사진 인증 → 스탬프 적립 → 리워드 신청. Angular 22 모바일 웹.

- 백엔드: `kdemo-stamp-back` (Flask + Supabase)
- 인증: 세션 쿠키. 모든 요청에 `withCredentials` 적용 (인터셉터 일괄 처리)
- 현재 mock 모드 — 백엔드 없이 전체 화면 확인 가능

---

## 시작

```bash
npm install
npm start          # http://localhost:4200
```

- 4200 이 이미 쓰이고 있으면 포트 지정 — `npm start -- --port 4300`
- `/api/*` → dev 프록시로 백엔드 `localhost:5001` 전달 (`proxy.conf.json`)
- mock ↔ 실제 전환: `src/environments/environment.ts` 의 `useMockApi` 한 값
- mock 응답은 실제 필드명·오류 형태와 동일하게 작성. Supabase 준비 후 `false` 로 변경

---

## 구조

```
app/
  core/          모델 · API 계약 · 서비스
  auth/          로그인 · 세션 · 가드
  pages/         화면 10개
  shared/
    layout/      헤더 · 탭바 · 구분선
    ui/          공용 부품
    directives/  화면 보조
    dev/         mock 확인 도구
```

- `core` : 백엔드 응답 원형(`api.dto.ts`) · 화면 모델(`models.ts`) · 변환(`api.mapper.ts`) · 도메인 서비스 3종
- `auth` : 인증 서비스, 라우트 가드, `withCredentials` 인터셉터
- `pages` : 메인 · 로그인 · 인증코드 · 내 방문기록 · 장소 목록 · 장소 상세 · 사진 인증 · 리워드
- `shared` : 두 화면 이상이 쓰는 것만. 한 화면 전용은 그 페이지 폴더 아래 중첩
- `dev` : 방문 0곳 / 3곳 / 6곳 상태를 버튼으로 오가는 개발 전용 패널. mock 빌드에서만 노출

**HTTP 호출은 서비스 안에서만.** 컴포넌트는 엔드포인트·헤더를 모름.

### 연동 API 9개

| API                            | 호출 시점                   |
| :----------------------------- | :-------------------------- |
| `POST /api/auth/send-otp`      | 인증코드 요청               |
| `POST /api/auth/verify-otp`    | 6자리 입력 · 세션 쿠키 발급 |
| `GET /api/auth/user`           | 로그인 상태 확인            |
| `POST /api/auth/logout`        | 로그아웃                    |
| `GET /api/spaces`              | 장소 목록                   |
| `GET /api/photos`              | 방문 기록                   |
| `POST /api/photos/upload`      | 사진 인증 제출 (multipart)  |
| `GET /api/rewards/eligibility` | 리워드 자격                 |
| `POST /api/rewards/code`       | 리워드 코드 발급            |

- 요청·응답 상세는 `src/app/core/api.dto.ts` (백엔드 코드 위치 주석 포함)
- 조회 3종의 401은 오류가 아닌 비로그인 상태로 처리 → 전체 미방문 표시
- 사진은 업로드 전 프론트에서 축소 (긴 변 1600px · JPEG) → 10MB 제한 내 유지

---

## 장소 데이터 구성

화면 하나 = 서버 값 + 프론트 값 조합.

- 서버 소유 : `id`(uuid) · `name` · `is_required`. 방문 기록은 `id` 기준 연결
- 프론트 소유 : 주소 · 소개 문구 · 인증 팁 · 지도 링크 등 표시용 정보 전체
  - 위치 `src/app/core/spaces.content.ts`
  - 상세 화면 본문은 `sections` 배열. 배열 순서 = 화면 노출 순서
- 두 값을 잇는 키는 현재 `name` 문자열 (`findContentByName()`)

| 장소               | slug                      | 필수 |
| :----------------- | :------------------------ | :--: |
| 민주화운동기념관   | `korean-democracy-museum` |  ●   |
| 서울시립유스호스텔 | `seoul-youth-hostel`      |      |
| 명동성당           | `myeongdong-cathedral`    |      |
| 마로니에공원       | `marronnier-park`         |      |
| 전태일다리         | `jeon-taeil-bridge`       |      |
| 광화문광장         | `gwanghwamun-square`      |      |

- 필수 표시는 리워드 1차 조건 (민주화운동기념관 포함 3곳 방문)

---

## 요청 & 궁금한 점

### 요청

- **`spaces` 테이블 `slug` 컬럼 추가 + 6곳 seed, `/api/spaces` 응답에 포함**
  현재 연결 키가 `name` 문자열. 서버 장소명이 한 글자만 달라져도 해당 장소가 화면에서 조용히 누락.
  slug 값과 필수 여부는 위 표 기준
- **대문자 이메일 로그인 실패** — `send-otp` 는 `.strip().lower()`, `verify-otp` 는 `.strip()` 만이라 키 불일치.
  프론트에서 소문자 변환으로 우회 중이나 서버 정합이 맞는 위치
- **오류 응답에 구분 코드 추가** — 지금은 한국어 문장뿐이라 상태코드로만 분기 가능. 문구 변경 시 조용히 깨짐
- **배포 시 쿠키 설정 협의** — 프론트·백엔드 도메인 분리 시 `SameSite` 조정과
  `ALLOWED_ORIGINS` 추가 필요. 로컬 프록시 환경에서는 재현 안 됨
- **Supabase 프로젝트 준비 시점 공유** — 연동 검증 일정 조율용
- **장소별 대표 이미지 · 예시 인증 사진** — 현재 목록 thumb 로 대체 중

### 궁금한 점

- 리워드 신청 **이후 상태**(검수 중 · 지급 확정 · 발송 완료)를 프론트가 알 방법이 있는지.
  구글폼 수집 방식이라 백엔드가 신청 상태를 모르는 구조로 이해. 관련 화면 4개 보류 중
- `GET /api/spaces` 를 비로그인에 여는 것이 가능한지. `slug` 가 오면 불필요
- 이메일 로그인과 문자 로그인을 **같은 사람으로 볼지**. `users` 가 각각 upsert 되는 구조
- 운영 기간(2026-09-15 ~ 11-10) 검사 주체가 프론트인지 서버인지
- 방문 취소 · 사진 삭제 API 가 필요한 시나리오가 있는지

---

## 연동 후 확인 항목

백엔드 연결 시점에 함께 볼 목록.

- 장소 목록 6곳 전부 표시 — `name` 매칭 실패 시 조용히 누락되므로 개수 확인
- 세션 쿠키 유지 — 새로고침 후에도 로그인 상태
- 비로그인 둘러보기 — 조회 3종 401이 오류 화면 대신 미방문 표시로 처리되는지
- 인증코드 재전송 60초 제한 (429)
- 인증코드 5회 오류 후 폐기 → 재요청 안내
- 리워드 자격 판정 — 필수 장소 포함 3곳 / 미포함 3곳 두 경우
- 리워드 코드 재발급 — 같은 단계 재요청 시 동일 코드
- 구글폼 미설정 시 `formUrl: null` 응답에서 코드만 표시되는지
- 배포 후 CORS · 쿠키 `SameSite` — 로컬 프록시에서는 재현 불가
