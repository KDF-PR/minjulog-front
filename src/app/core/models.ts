// models.ts — 화면이 쓰는 모델. 전부 camelCase.
//
// **세 가지를 분리한다.**
//   ① `SpaceContent` — 프론트가 들고 있는 고정 콘텐츠 (주소·설명·인증 팁)
//   ② `Space`        — ①에 백엔드 마스터 값(uuid·필수 여부)을 더한 **장소 고정 정보**
//   ③ `Visit`        — **사용자마다 다른 상태** (언제 어떤 사진으로 인증했는가)
//
// ②와 ③을 한 객체에 합치지 않는다. 합치면 사용자 상태가 바뀔 때마다 장소 정보까지
// 새로 만들어야 하고, 로그인 전후로 같은 장소가 다른 객체가 된다.
// 둘이 함께 필요한 화면은 `SpaceVisit` 로 짝지어 받는다.
//
// 백엔드 원형은 `api.dto.ts`, 변환은 `api.mapper.ts` 한 곳에서만 한다.

/** 장소 식별자 — 프론트 콘텐츠의 키. 백엔드 uuid 와는 별개다 */
export type SpaceSlug =
  | 'minjuhwa'
  | 'youthhostel'
  | 'myeongdong'
  | 'maronie'
  | 'jeontaeil'
  | 'gwanghwamun';

export const SPACE_SLUGS: readonly SpaceSlug[] = [
  'minjuhwa',
  'youthhostel',
  'myeongdong',
  'maronie',
  'jeontaeil',
  'gwanghwamun',
] as const;

/** 리워드 단계. 백엔드 `REWARD_TIERS = (3, 6)` 과 같아야 한다 (`app.py:459`) */
export type RewardTier = 3 | 6;
export const REWARD_TIERS: readonly RewardTier[] = [3, 6] as const;

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
