/**
 * `GET /api/spaces` 가짜 응답.
 *
 * **백엔드 응답 모양을 그대로 흉내낸다** (`SpaceDto` 3필드, snake_case).
 * 화면용 값을 섞지 않는다. 섞으면 실제 API 로 바꿀 때 화면이 조용히 깨진다.
 *
 * uuid 는 고정 더미다. 실제 값이 확정되면 이 파일을 버리고 `useMockApi = false` 로 전환한다.
 */

import { SpaceDto } from '../api.dto';
import { SPACES_CONTENT } from '../spaces.content';
import { SpaceSlug } from '../models';

/** slug → 더미 uuid. 새로고침해도 같은 값이라 방문 기록과 짝이 맞는다 */
export const MOCK_SPACE_ID: Record<SpaceSlug, string> = {
  'korean-democracy-museum': '11111111-1111-4111-8111-111111111111',
  'seoul-youth-hostel': '22222222-2222-4222-8222-222222222222',
  'myeongdong-cathedral': '33333333-3333-4333-8333-333333333333',
  'marronnier-park': '44444444-4444-4444-8444-444444444444',
  'jeon-taeil-bridge': '55555555-5555-4555-8555-555555555555',
  'gwanghwamun-square': '66666666-6666-4666-8666-666666666666',
};

/**
 * 백엔드는 `name` 오름차순으로 준다 (`app.py:355`).
 * 화면 표시 순서는 프론트가 정하므로, 여기서도 정렬을 흉내내 실제와 같은 조건을 만든다.
 */
export const SPACES_MOCK: SpaceDto[] = SPACES_CONTENT.map((content) => ({
  id: MOCK_SPACE_ID[content.slug],
  name: content.name,
  is_required: content.slug === 'korean-democracy-museum',
})).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
