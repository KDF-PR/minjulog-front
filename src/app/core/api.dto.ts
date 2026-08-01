/**
 * 백엔드가 주는 응답 **원형**.
 *
 * 화면은 이 타입을 쓰지 않는다. 서비스가 `models.ts` 의 화면 모델로 바꿔서 넘긴다.
 * 백엔드 표기법이 섞여 있어(camelCase / snake_case) 경계를 여기 모은다.
 *
 * 근거는 `app.py` 각 라우트의 select 절. 필드를 임의로 늘리지 않는다.
 */

/** `GET /api/spaces` — `app.py:350` (`select("id, name, is_required")`) */
export interface SpaceDto {
  /** Supabase 가 만든 uuid. 프론트 콘텐츠와 잇는 키가 없다 — `SPACE_SLUG_BY_NAME` 참고 */
  id: string;
  name: string;
  is_required: boolean;
}

export interface SpacesResponseDto {
  spaces: SpaceDto[];
}

/** `GET /api/photos` — `app.py:442` */
export interface PhotoDto {
  id: string;
  space_id: string;
  path: string;
  /** 공개 URL. 버킷이 public 이라 주소를 아는 사람은 누구나 열 수 있다 */
  url: string;
  content_type: string;
  size_bytes: number;
  /** timestamptz. ISO 8601 문자열 */
  created_at: string;
}

export interface PhotosResponseDto {
  photos: PhotoDto[];
}

/** `POST /api/photos/upload` — `app.py:364` */
export interface UploadPhotoResponseDto {
  message: string;
  url: string;
  path: string;
}

/** `GET /api/rewards/eligibility` — `app.py:524`. 이쪽만 camelCase 다 */
export interface EligibilityDto {
  visitedCount: number;
  /** 필수 장소(민주화운동기념관) 방문 여부 */
  hasRequired: boolean;
  /** 지금 신청 가능한 tier */
  eligibleTiers: number[];
  /** 이미 코드를 발급받은 tier */
  claimedTiers: number[];
}

/** `POST /api/rewards/code` — `app.py:542` */
export interface RewardCodeDto {
  tier: number;
  /** 8자리. 구글폼에 프리필로 들어간다 */
  code: string;
  /** 구글폼 미설정 시 null 로 온다 (`app.py:487`) — 코드는 항상 화면에 함께 보여준다 */
  formUrl: string | null;
}

/** 실패 응답. 구분용 코드가 없고 한국어 문장만 온다 — 상태코드로 분기한다 */
export interface ApiErrorDto {
  error: string;
}
