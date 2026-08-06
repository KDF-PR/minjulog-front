/**
 * 장소 6곳의 화면 콘텐츠.
 *
 * 백엔드 `spaces` 테이블에는 `id` · `name` · `is_required` 뿐이라 주소·설명·인증 팁을
 * 저장할 자리가 없다. 그래서 프론트가 들고 있다 (`sql/spaces_table.sql`).
 *
 * 연결 키는 아직 `name` 문자열이다(`findContentByName`). 백엔드 `id` 가 Supabase uuid 라
 * 여기 `slug` 와 맞출 수 없어서다. 이름이 바뀌면 깨지므로 `slug` 컬럼 추가를 요청해 둔
 * 상태다 — `docs/요구사항정의.md` 9장 ⑦.
 *
 * 값의 출처가 섞여 있다. 각 항목 주석의 `확정` · `시안` · `임시` · `미정` 표시를 따른다.
 * **선택 항목은 비어 있을 수 있다. 화면은 값이 없으면 그 영역을 통째로 숨긴다** —
 * 빈 문자열을 넣지 않는다.
 *
 * 원본: `stamptour/src/app/core/institutions.ts` + 디자인 v3 `08 장소 상세`.
 */

import { SpaceContent, SpaceSlug } from './models';

/**
 * 운영 기간. 디자인 `01 메인` 표기와 같아야 한다.
 *
 * `start` · `end` 는 기간 검사에 쓸 값이고 `label` 은 화면에 그대로 나가는 문구다.
 * **세 값이 같은 기간을 가리켜야 한다** — 한쪽만 고치면 표시와 판정이 어긋난다.
 * 지금은 `label` 만 쓰이고, 검사 주체는 아직 정해지지 않았다.
 */
export const OPERATION_PERIOD = {
  start: '2026-09-15',
  end: '2026-11-10',
  label: '참여 기간 : 2026년 9월 15일 ~ 11월 10일',
} as const;

/** 필수 방문 장소. 리워드 1차 조건에 들어간다 */
export const REQUIRED_SPACE_SLUG: SpaceSlug = 'korean-democracy-museum';

export const SPACES_CONTENT: readonly SpaceContent[] = [
  {
    slug: 'korean-democracy-museum',
    shortName: '민주화운동기념관',
    name: '민주화운동기념관',
    region: '용산구',
    address: '서울 용산구 한강대로71길 37',
    category: '기념관 · 전시',
    tagline: '민주주의를 기억하는 여행의 출발점', // 시안 — P1 `285:2986`
    summary:
      '과거 국가폭력이 자행되던 남영동 대공분실이 민주주의를 배우고 기억하는 기념관이 되었습니다.',
    photoGuide: '기념관 입구나 상징 조형물이 보이게 한 장 담아 주세요.',
    courseOrder: 1,
    markColor: 'pink', // 확정 — 시안 `02 내 방문기록`
    sections: [
      { type: 'map' },
      {
        // 문구는 시안 `space-detail` 에서 옮겼다
        type: 'story',
        paragraphs: [
          '민주화운동기념관은 과거 국가폭력의 상징이었던 남영동 대공분실 자리에 조성된 공간으로, 독재정권의 어두운 역사와 이를 극복한 민주주의의 이야기를 담고 있습니다.',
          '김근태, 리영희 선생을 비롯한 수많은 민주화운동가들이 이곳에서 고문을 당했고, 박종철 열사의 죽음은 1987년 6월 민주항쟁의 불씨가 되었습니다.',
        ],
        // 문구는 시안 `121:628`. 주소는 임시 — 시안에 하이퍼링크가 없어
        // '민주야 탐방가자' 안내가 올라오는 민주로드 사이트로 연결해 뒀다
        link: {
          label: '‘민주야 탐방가자’에서 더 보기',
          url: 'https://www.minjuroad.or.kr/',
        },
      },
      // 관람 시간·휴관일(visitInfo)은 공식 안내를 받아 채운다 — 지금은 두지 않는다
      {
        type: 'viewPoints',
        points: [
          {
            name: 'M2(대공분실) 509호',
            desc: '박종철 열사가 마지막으로 머물렀던 조사실',
          },
          {
            name: 'E(교육동) 4층 민주마루 발코니',
            desc: '대공분실과 남영역 일대를 한눈에 내려다볼 수 있는 전망 공간',
          },
        ],
      },
    ],
    nearby: [],
  },
  {
    slug: 'seoul-youth-hostel',
    shortName: '서울시립유스호스텔',
    name: '서울시립유스호스텔',
    region: '종로구',
    address: '서울 종로구 신영동 산25-1',
    category: '교류 · 쉼',
    tagline: '북한산 자락에서 잠시 쉬어 가는 곳', // 임시 — 확정 문구 오면 교체
    summary: '도심 속 청소년과 시민을 위한 숙박·문화 교류 공간이에요.',
    photoGuide: '건물 외관이나 안내 표지가 보이게 찍어 주세요.',
    courseOrder: 2,
    markColor: 'lemon', // 확정 — 겹치지 않는 브랜드 색으로 배정
    sections: [
      { type: 'map' },
      {
        type: 'story',
        paragraphs: ['북한산 자락에 있어 도심에서 잠시 벗어나 쉬어 갈 수 있는 곳이에요.'],
      },
    ],
  },
  {
    slug: 'myeongdong-cathedral',
    shortName: '명동성당',
    name: '명동성당',
    region: '중구',
    address: '서울 중구 명동길 74',
    category: '성당 · 상징 공간',
    tagline: '시민의 목소리가 모여들던 피난처', // 임시 — 확정 문구 오면 교체
    summary: '민주화운동 시기 시민들의 목소리가 모였던 성당이에요.',
    photoGuide: '성당 전경이나 정문이 보이게 담아 주세요. 미사 중에는 조용히 부탁드려요.',
    courseOrder: 3,
    markColor: 'lime', // 확정 — 겹치지 않는 브랜드 색으로 배정
    sections: [
      { type: 'map' },
      {
        type: 'story',
        paragraphs: [
          '1970~80년대 농성과 집회가 이어지며 피난처 역할을 했어요.',
          '지금도 미사가 열리는 공간이라 방문 전에 시간을 확인하면 좋아요.',
        ],
      },
      // v3 `09 장소 상세 · 방문 완료` 시안 문구
      {
        type: 'visitInfo',
        paragraphs: ['방문 전 미사 시간을 확인해 주세요.'],
        tags: ['명동역 6번 출구'],
      },
    ],
    nearby: [
      { slug: 'marronnier-park', walkMinutes: 20 },
      { slug: 'jeon-taeil-bridge', walkMinutes: 10 },
    ],
  },
  {
    slug: 'marronnier-park',
    shortName: '마로니에공원',
    name: '마로니에공원',
    region: '종로구',
    address: '서울 종로구 대학로8길 1',
    category: '공원 · 열린 공간',
    tagline: '대학로 한복판의 열린 광장', // 임시 — 확정 문구 오면 교체
    summary: '대학로 한복판, 누구에게나 열린 광장이에요.',
    photoGuide: '마로니에 나무나 상징 조형물이 보이게 한 장 담아 주세요. 구도는 자유롭게요.',
    courseOrder: 4,
    markColor: 'skyblue', // 확정 — 시안 `02 내 방문기록`
    sections: [
      { type: 'map' },
      {
        type: 'story',
        paragraphs: [
          '1980년대부터 시민들이 목소리를 나누고, 공연과 전시가 열리는 열린 마당으로 자리 잡았어요.',
        ],
      },
      // v3 `08 장소 상세 · 미방문` 시안 문구
      {
        type: 'visitInfo',
        tags: ['상시 개방', '무료', '혜화역 2번 출구'],
      },
    ],
    nearby: [
      { slug: 'jeon-taeil-bridge', walkMinutes: 12 },
      { slug: 'myeongdong-cathedral', walkMinutes: 20 },
    ],
  },
  {
    slug: 'jeon-taeil-bridge',
    shortName: '전태일다리',
    name: '전태일다리',
    region: '종로구',
    address: '서울 종로구 청계천로 (버들다리)',
    category: '다리 · 기억 공간',
    tagline: '스물두 살의 외침을 기억하는 다리', // 임시 — 확정 문구 오면 교체
    summary: '노동운동가 전태일을 기리는 청계천 위 다리예요.',
    photoGuide: '전태일 동상이나 다리 이름 표지가 보이게 찍어 주세요.',
    courseOrder: 5,
    markColor: 'green', // 확정 — 겹치지 않는 브랜드 색으로 배정
    sections: [
      { type: 'map' },
      {
        type: 'story',
        paragraphs: [
          '1970년 이곳 평화시장 앞에서 스물두 살 전태일이 노동자의 권리를 외쳤어요.',
          '다리 위에 그를 기리는 동상과 동판이 있어요.',
        ],
      },
    ],
  },
  {
    slug: 'gwanghwamun-square',
    shortName: '광화문광장',
    name: '광화문광장',
    region: '종로구',
    address: '서울 종로구 세종대로 172',
    category: '광장 · 열린 공간',
    tagline: '함께 모여 목소리를 내온 서울의 광장', // 임시 — 확정 문구 오면 교체
    summary: '시민들이 모여 목소리를 내온 서울의 대표 광장이에요.',
    photoGuide: '광장 전경이나 대표 조형물이 보이게 담아 주세요.',
    courseOrder: 6,
    markColor: 'orange', // 확정 — 시안 `02 내 방문기록`
    sections: [
      { type: 'map' },
      {
        type: 'story',
        paragraphs: [
          '집회와 추모, 축제가 모두 열려온 자리예요. 동선이 넓어 천천히 둘러보기 좋아요.',
        ],
      },
    ],
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
