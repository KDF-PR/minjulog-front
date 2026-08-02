/**
 * 화면이 쓰는 모델. 전부 camelCase.
 *
 * 세 가지를 분리한다.
 * - `SpaceContent` — 프론트가 들고 있는 고정 콘텐츠 (주소·설명·인증 팁)
 * - `Space` — 위에 백엔드 마스터 값(uuid·필수 여부)을 더한 **장소 고정 정보**
 * - `Visit` — **사용자마다 다른 상태** (언제 어떤 사진으로 인증했는가)
 *
 * `Space` 와 `Visit` 를 한 객체로 합치지 않는다. 합치면 방문 하나가 바뀔 때마다 장소 정보까지
 * 새로 만들어야 하고, 로그인 전후로 같은 장소가 다른 객체가 된다.
 * 둘이 함께 필요한 화면은 `SpaceVisit` 로 짝지어 받는다.
 *
 * 백엔드 원형은 `api.dto.ts`, 변환은 `api.mapper.ts` 한 곳에서만 한다.
 */

/** 장소 식별자 — 프론트 콘텐츠의 키. 백엔드 uuid 와는 별개다 */
export type SpaceSlug =
  | 'korean-democracy-museum'
  | 'seoul-youth-hostel'
  | 'myeongdong-cathedral'
  | 'marronnier-park'
  | 'jeon-taeil-bridge'
  | 'gwanghwamun-square';

export const SPACE_SLUGS: readonly SpaceSlug[] = [
  'korean-democracy-museum',
  'seoul-youth-hostel',
  'myeongdong-cathedral',
  'marronnier-park',
  'jeon-taeil-bridge',
  'gwanghwamun-square',
] as const;

/** 리워드 단계. 백엔드 `REWARD_TIERS = (3, 6)` 과 같아야 한다 (`app.py:459`) */
export type RewardTier = 3 | 6;
export const REWARD_TIERS: readonly RewardTier[] = [3, 6] as const;

/**
 * 방문 완료 스탬프 마커 색. 장소마다 하나씩 고정이다.
 *
 * 색 값은 `utils/_colors.scss` 의 `$stamp-mark-*` 가 들고 있다. 여기에는 이름만 둔다 —
 * 색 자체가 오면 화면 코드가 색을 아는 자리가 된다.
 */
export type StampMark = 'pink' | 'skyblue' | 'orange' | 'lemon' | 'lime' | 'green';
export const STAMP_MARKS: readonly StampMark[] = [
  'pink',
  'skyblue',
  'orange',
  'lemon',
  'lime',
  'green',
] as const;

// ── ① 고정 콘텐츠 — 프론트 소유 ────────────────────────────────────

/**
 * 프론트가 보관하는 장소 콘텐츠. 백엔드 `spaces` 테이블에 자리가 없는 항목들이다.
 * 원본은 `spaces.content.ts`.
 */
export interface SpaceContent {
  slug: SpaceSlug;
  /** 그리드용 짧은 이름 */
  shortName: string;
  /** 정식 명칭. 백엔드 `name` 과 일치시켜 매칭에 쓴다 */
  name: string;
  region: string;
  address: string;
  /** 한 줄 정체성 — 상세 화면 최상단 (예: `공원 · 열린 공간`) */
  category: string;
  /** 요약 2~3문장 */
  summary: string;
  /** 이곳의 이야기 — 접기 영역 */
  description: string;
  /** 인증 팁 — 어디를 담으면 되는지 */
  photoGuide: string;
  /** 일일 추천 코스 순번. 방문 조건과 무관한 참고값 */
  courseOrder: number;
  /** 방문 완료 스탬프 마커 색 */
  markColor: StampMark;

  // ── 선택 항목 ─────────────────────────────────────────────
  // 공식 콘텐츠를 못 받아 비어 있는 장소가 있다. **없으면 그 영역을 통째로 숨긴다.**

  /** 「자세히 둘러보면 좋을 곳」 — 그 장소 안에서 눈여겨볼 지점. 없으면 절을 통째로 숨긴다 */
  viewPoints?: SpaceViewPoint[];
  /** 이곳의 이야기 아래 외부 링크. 없으면 숨긴다 */
  storyLink?: SpaceLink;
  /** 대표 사진. `/assets/images/spaces/<slug>.jpg` */
  heroImage?: string;
  /** 예시 인증 사진. `/assets/images/spaces/<slug>-example.jpg` */
  photoExample?: string;
  /** 방문 정보 — 개방시간 · 요금 · 교통 */
  visitInfo?: SpaceVisitInfo;
  /** 지도 미리보기·길찾기용 좌표 */
  coords?: SpaceCoords;
  /** 가까운 다른 장소. 상세 화면 하단에서 다음 걸음을 잇는다 */
  nearby?: NearbySpace[];
}

/** 현장에서 필요한 정보만 담는다. 없는 항목은 화면에서 뺀다 */
export interface SpaceVisitInfo {
  /** 예: `상시 개방`, `09:30 – 17:30` */
  openingHours?: string;
  /** 예: `무료 관람` */
  admissionFee?: string;
  /** 예: `혜화역 2번 출구` */
  transit?: string;
  /** 휴관일 등 보충 안내 */
  note?: string;
}

export interface SpaceCoords {
  lat: number;
  lng: number;
}

export interface NearbySpace {
  slug: SpaceSlug;
  /** 도보 소요 분 */
  walkMinutes: number;
}

/** 장소 안에서 눈여겨볼 지점. 다른 장소가 아니라 그 장소의 일부다 */
export interface SpaceViewPoint {
  /** 예: `M2(대공분실) 509호` */
  name: string;
  /** 왜 볼 만한지 한 줄 */
  desc: string;
}

/** 바깥으로 나가는 링크 */
export interface SpaceLink {
  label: string;
  url: string;
}

// ── ② 장소 고정 정보 — 사용자와 무관 ────────────────────────────────

/**
 * 화면이 쓰는 장소. **사용자 상태를 담지 않는다.**
 * 누가 보든 같은 값이라 로그인 전에도 그대로 쓸 수 있다.
 */
export interface Space extends SpaceContent {
  /** 백엔드 uuid. 사진 업로드 시 `space_id` 로 보낸다 */
  spaceId: string;
  /** 리워드 필수 방문 장소 여부 (백엔드 `is_required`) */
  isRequired: boolean;
}

// ── ③ 사용자 상태 ──────────────────────────────────────────────────

/** 방문 인증 한 건. 사용자마다 다르다 */
export interface Visit {
  visitId: string;
  spaceId: string;
  photoUrl: string;
  visitedAt: Date;
}

/** 장소 + 그 사용자의 방문 상태. 목록·상세 화면이 함께 볼 때 쓴다 */
export interface SpaceVisit {
  space: Space;
  /** 방문 전이면 null */
  visit: Visit | null;
}

/** 리워드 자격. 서버가 계산한 값이다 */
export interface RewardStatus {
  visitedCount: number;
  hasRequired: boolean;
  eligibleTiers: RewardTier[];
  claimedTiers: RewardTier[];
}

/** 발급받은 리워드 코드 */
export interface RewardCode {
  tier: RewardTier;
  code: string;
  /** 구글폼 미설정 시 null — 코드는 항상 화면에 함께 보여준다 */
  formUrl: string | null;
}

// ── 화면 상태 ──────────────────────────────────────────────────────

/**
 * 방문 현황 화면 상태 — 디자인 `02`~`06` 다섯 단계.
 * 방문 수만으로는 갈리지 않는다. `requiredMissing` 은 3곳을 채웠지만
 * 민주화운동기념관을 안 간 경우로, 별도 안내 화면(`04`)이 있다.
 */
export type ProgressState =
  | 'empty' // 02 · 0곳
  | 'inProgress' // 03 · 1~2곳
  | 'requiredMissing' // 04 · 3곳이지만 필수 미방문
  | 'firstComplete' // 05 · 필수 포함 3곳
  | 'allComplete'; // 06 · 6곳

/** 화면 공통 로딩 상태 */
export type LoadState = 'idle' | 'loading' | 'ready' | 'error';
