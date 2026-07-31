// spaces.content.ts — 장소 6곳의 화면 콘텐츠.
//
// **왜 프론트가 들고 있나** — 백엔드 `spaces` 테이블 컬럼이 `id` · `name` · `is_required` 뿐이다
// (`../kdemo-stamp-back/sql/spaces_table.sql`). 주소·설명·인증 팁은 저장할 자리가 없다.
//
// **연결 키 문제** — 백엔드 `id` 는 Supabase 가 만드는 uuid 라 여기 `slug` 와 맞출 방법이 없다.
// 지금은 `name` 문자열로 잇는다(아래 `findContentByName`). 이름이 바뀌면 깨지므로
// 백엔드에 `slug` 컬럼 추가를 요청해 둔 상태다 — `docs/요구사항정의.md` 9장 ⑦.
//
// 원본: `stamptour/src/app/core/institutions.ts` + 디자인 v3 `08 장소 상세`.
// `category` · `photoGuide` 는 v3 시안 문구를 옮긴 것이고 나머지 장소는 임시값이다.

import { SpaceContent, SpaceSlug } from './models';

/** 운영 기간. 디자인 `01 메인` 표기와 같아야 한다 */
export const OPERATION_PERIOD = {
  start: '2026-09-15',
  end: '2026-09-30',
  label: '2026. 9. 15. – 9. 30.',
} as const;

/** 필수 방문 장소. 리워드 1차 조건에 들어간다 */
export const REQUIRED_SPACE_SLUG: SpaceSlug = 'minjuhwa';

export const SPACES_CONTENT: readonly SpaceContent[] = [
  {
    slug: 'minjuhwa',
    shortName: '민주화운동기념관',
    name: '민주화운동기념관',
    region: '용산구',
    address: '서울 용산구 한강대로71길 37',
    category: '기념관 · 전시',
    summary: '한국 민주화운동의 역사를 기록하고 전시하는 공간이에요.',
    description:
      '옛 남영동 대공분실 자리에 세워졌어요. 고문과 감시가 이뤄지던 건물을 그대로 두고, ' +
      '그 위에 기억하는 공간을 얹었어요. 여섯 곳 가운데 이곳만 꼭 들러야 해요.',
    photoGuide: '기념관 입구나 상징 조형물이 보이게 한 장 담아 주세요.',
    courseOrder: 1,
  },
  {
    slug: 'youthhostel',
    shortName: '서울시립유스호스텔',
    name: '서울시립유스호스텔',
    region: '종로구',
    address: '서울 종로구 신영동 산25-1',
    category: '교류 · 쉼',
    summary: '도심 속 청소년과 시민을 위한 숙박·문화 교류 공간이에요.',
    description: '북한산 자락에 있어 도심에서 잠시 벗어나 쉬어 갈 수 있는 곳이에요.',
    photoGuide: '건물 외관이나 안내 표지가 보이게 찍어 주세요.',
    courseOrder: 2,
  },
  {
    slug: 'myeongdong',
    shortName: '명동성당',
    name: '명동성당',
    region: '중구',
    address: '서울 중구 명동길 74',
    category: '성당 · 상징 공간',
    summary: '민주화운동 시기 시민들의 목소리가 모였던 성당이에요.',
    description:
      '1970~80년대 농성과 집회가 이어지며 피난처 역할을 했어요. ' +
      '지금도 미사가 열리는 공간이라 방문 전에 시간을 확인하면 좋아요.',
    photoGuide: '성당 전경이나 정문이 보이게 담아 주세요. 미사 중에는 조용히 부탁드려요.',
    courseOrder: 3,
  },
  {
    slug: 'maronie',
    shortName: '마로니에공원',
    name: '마로니에공원',
    region: '종로구',
    address: '서울 종로구 대학로8길 1',
    category: '공원 · 열린 공간',
    summary: '대학로 한복판, 누구에게나 열린 광장이에요.',
    description:
      '1980년대부터 시민들이 목소리를 나누고, 공연과 전시가 열리는 열린 마당으로 자리 잡았어요.',
    photoGuide: '마로니에 나무나 상징 조형물이 보이게 한 장 담아 주세요. 구도는 자유롭게요.',
    courseOrder: 4,
  },
  {
    slug: 'jeontaeil',
    shortName: '전태일다리',
    name: '전태일다리',
    region: '종로구',
    address: '서울 종로구 청계천로 (버들다리)',
    category: '다리 · 기억 공간',
    summary: '노동운동가 전태일을 기리는 청계천 위 다리예요.',
    description:
      '1970년 이곳 평화시장 앞에서 스물두 살 전태일이 노동자의 권리를 외쳤어요. ' +
      '다리 위에 그를 기리는 동상과 동판이 있어요.',
    photoGuide: '전태일 동상이나 다리 이름 표지가 보이게 찍어 주세요.',
    courseOrder: 5,
  },
  {
    slug: 'gwanghwamun',
    shortName: '광화문광장',
    name: '광화문광장',
    region: '종로구',
    address: '서울 종로구 세종대로 172',
    category: '광장 · 열린 공간',
    summary: '시민들이 모여 목소리를 내온 서울의 대표 광장이에요.',
    description: '집회와 추모, 축제가 모두 열려온 자리예요. 동선이 넓어 천천히 둘러보기 좋아요.',
    photoGuide: '광장 전경이나 대표 조형물이 보이게 담아 주세요.',
    courseOrder: 6,
  },
] as const;

const CONTENT_BY_SLUG = new Map<SpaceSlug, SpaceContent>(
  SPACES_CONTENT.map((content) => [content.slug, content]),
);

const CONTENT_BY_NAME = new Map<string, SpaceContent>(
  SPACES_CONTENT.map((content) => [content.name, content]),
);

export function findContentBySlug(slug: SpaceSlug): SpaceContent | undefined {
  return CONTENT_BY_SLUG.get(slug);
}

/**
 * 백엔드 `name` 으로 콘텐츠를 찾는다.
 *
 * **임시 방편이다.** 백엔드에 `slug` 컬럼이 생기면 이 함수를 지우고 slug 로 직접 잇는다.
 * 이름이 한 글자만 달라도 못 찾으므로, 못 찾은 장소는 서비스가 로그로 남긴다.
 */
export function findContentByName(name: string): SpaceContent | undefined {
  return CONTENT_BY_NAME.get(name.trim());
}
