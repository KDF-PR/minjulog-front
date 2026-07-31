// visits.mock.ts — `GET /api/photos` 가짜 응답 + 방문 상태 시나리오.
//
// 디자인 `02`~`06` 다섯 화면이 각각 어떤 방문 상태인지 여기서 만든다.
// `04` 는 방문 수만으로 재현되지 않는다 — 3곳이지만 필수(민주화운동기념관)를 빼야 한다.

import { PhotoDto } from '../api.dto';
import { SpaceSlug } from '../models';
import { MOCK_SPACE_ID } from './spaces.mock';

/** 화면 확인용 시나리오. `MOCK_SCENARIO` 를 바꿔가며 5개 상태를 본다 */
export type MockVisitScenario =
  | 'empty' // 02 · 0곳
  | 'partial' // 03 · 2곳 (필수 포함)
  | 'requiredMissing' // 04 · 3곳이지만 필수 미방문
  | 'firstComplete' // 05 · 필수 포함 3곳
  | 'allComplete'; // 06 · 6곳

/** 지금 볼 화면. 개발 중 이 값만 바꾼다 */
export const MOCK_SCENARIO: MockVisitScenario = 'partial';

const SCENARIO_SLUGS: Record<MockVisitScenario, SpaceSlug[]> = {
  empty: [],
  partial: ['minjuhwa', 'maronie'],
  // 필수를 일부러 뺀다 — 방문 3곳인데 1차 리워드가 안 열리는 상태
  requiredMissing: ['maronie', 'myeongdong', 'jeontaeil'],
  firstComplete: ['minjuhwa', 'maronie', 'myeongdong'],
  allComplete: [
    'minjuhwa',
    'youthhostel',
    'myeongdong',
    'maronie',
    'jeontaeil',
    'gwanghwamun',
  ],
};

/** 고정 기준 시각 — 매 실행마다 값이 흔들리지 않게 (운영 기간 안의 날짜) */
const BASE_TIME = new Date('2026-09-20T14:14:00+09:00').getTime();

function toPhotoDto(slug: SpaceSlug, index: number): PhotoDto {
  const spaceId = MOCK_SPACE_ID[slug];
  // 나중에 방문한 곳이 위로 오도록 시간을 벌린다 (백엔드는 created_at 내림차순)
  const createdAt = new Date(BASE_TIME + index * 36e5).toISOString();
  return {
    id: `photo-${slug}`,
    space_id: spaceId,
    path: `mock/${spaceId}/photo.jpg`,
    url: `https://placehold.co/800x600?text=${encodeURIComponent(slug)}`,
    content_type: 'image/jpeg',
    size_bytes: 512_000,
    created_at: createdAt,
  };
}

export function buildVisitsMock(scenario: MockVisitScenario = MOCK_SCENARIO): PhotoDto[] {
  return SCENARIO_SLUGS[scenario]
    .map(toPhotoDto)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export const VISITS_MOCK: PhotoDto[] = buildVisitsMock();
