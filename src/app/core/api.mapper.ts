/**
 * 백엔드 원형(`api.dto.ts`) ↔ 화면 모델(`models.ts`) 변환.
 *
 * 변환을 이 파일 하나로 모은다. 서비스마다 흩어지면 응답 필드 하나가 바뀔 때
 * 고칠 곳을 찾아다녀야 한다.
 *
 * 규칙 셋 — 화면 모델은 DTO 필드를 그대로 베끼지 않는다 · 백엔드 표기법(snake_case)이
 * 이 파일 밖으로 새지 않는다 · 날짜 문자열은 여기서 `Date` 로 바꾼다.
 */

import {
  EligibilityDto,
  PhotoDto,
  RewardCodeDto,
  SpaceDto,
  UploadPhotoResponseDto,
} from './api.dto';
import {
  RewardCode,
  RewardStatus,
  RewardTier,
  REWARD_TIERS,
  Space,
  SpaceContent,
  Visit,
} from './models';

// ── 장소 ────────────────────────────────────────────────────────────

/**
 * 백엔드 마스터 값 + 로컬 콘텐츠 → 장소 고정 정보.
 *
 * 백엔드가 주는 건 `id` · `name` · `is_required` 뿐이라 나머지는 콘텐츠에서 온다.
 * 사용자 상태(방문 여부)는 넣지 않는다 — `models.ts` 의 분리 규칙 참고.
 */
export function toSpace(dto: SpaceDto, content: SpaceContent): Space {
  return {
    ...content,
    spaceId: dto.id,
    isRequired: dto.is_required,
  };
}

// ── 방문 ────────────────────────────────────────────────────────────

/** `GET /api/photos` 한 건 → 방문 기록 */
export function toVisit(dto: PhotoDto): Visit {
  return {
    visitId: dto.id,
    spaceId: dto.space_id,
    photoUrl: dto.url,
    visitedAt: new Date(dto.created_at),
  };
}

/**
 * 업로드 응답 → 방문 기록.
 *
 * 업로드 응답에는 `id` 와 `created_at` 이 없다(`url` · `path` 만 온다).
 * 그래서 방문 시각은 클라이언트 시각으로 채우고, 식별자는 `space_id` 로 만든다.
 * 정확한 값이 필요하면 업로드 뒤 `GET /api/photos` 를 다시 부른다.
 */
export function toVisitFromUpload(dto: UploadPhotoResponseDto, spaceId: string): Visit {
  return {
    visitId: `visit-${spaceId}`,
    spaceId,
    photoUrl: dto.url,
    visitedAt: new Date(),
  };
}

// ── 리워드 ──────────────────────────────────────────────────────────

/** 알 수 없는 tier 가 오면 버린다 — 백엔드가 단계를 늘려도 화면이 깨지지 않게 */
function isRewardTier(value: number): value is RewardTier {
  return REWARD_TIERS.includes(value as RewardTier);
}

export function toRewardStatus(dto: EligibilityDto): RewardStatus {
  return {
    visitedCount: dto.visitedCount,
    hasRequired: dto.hasRequired,
    eligibleTiers: dto.eligibleTiers.filter(isRewardTier),
    claimedTiers: dto.claimedTiers.filter(isRewardTier),
  };
}

export function toRewardCode(dto: RewardCodeDto): RewardCode {
  if (!isRewardTier(dto.tier)) {
    throw new Error(`알 수 없는 리워드 단계입니다: ${dto.tier}`);
  }
  return {
    tier: dto.tier,
    code: dto.code,
    formUrl: dto.formUrl,
  };
}
