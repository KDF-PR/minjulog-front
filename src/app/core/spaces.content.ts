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
  },
  {
    slug: 'seoul-youth-hostel',
    shortName: '서울시립유스호스텔',
    name: '서울시립유스호스텔',
    region: '종로구',
    address: '서울 종로구 신영동 산25-1',
    category: '교류 · 쉼',
    tagline: '남산에 남겨진 국가폭력의 흔적',
    summary:
      '지금은 여행객들이 머무는 공간이지만, 이곳은 과거 중앙정보부와 국가안전기획부가 있던 자리입니다. 군사정권 시절 민주주의를 억압했던 국가권력의 흔적을 되짚어보며, 남산 곳곳에 남아 있는 민주주의와 인권의 흔적을 따라 걸어보세요.',
    photoGuide: '건물 외관이나 안내 표지가 보이게 찍어 주세요.',
    courseOrder: 2,
    markColor: 'yellow',
    sections: [
      { type: 'map' },
      {
        type: 'nearby',
        points: [
          {
            name: '기억의 터',
            desc: '일제강점기 일본군 ‘위안부’ 피해자를 기억하고 평화를 기원하는 추모공간',
          },
          {
            name: '남산골한옥마을',
            desc: '조선헌병사령부와 수도방위사령부가 있었던 예장동 일대의 역사를 함께 떠올려볼 수 있는 공간',
          },
        ],
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
    tagline: '민주주의를 지켜낸 마지막 울타리',
    summary:
      '명동성당은 종교시설을 넘어 한국 민주주의 역사에서 가장 상징적인 공간 가운데 하나입니다. 1987년 6월 민주항쟁 당시, 경찰의 강경 진압을 피해 모여든 시민과 학생들이 이곳에서 농성일 이어갔고, 명동성당은 이들을 품어 안으며 민주주의를 향한 연대의 든든한 울타리가 되어주었습니다.',
    photoGuide: '성당 전경이나 정문이 보이게 담아 주세요. 미사 중에는 조용히 부탁드려요.',
    courseOrder: 3,
    markColor: 'skyblue',
    sections: [
      { type: 'map' },
      {
        type: 'nearby',
        points: [
          {
            name: '서울YWCA',
            desc: '여성·시민운동과 민주화운동을 함께 이어온 공간',
          },
          {
            name: '향린교회',
            desc: '민주주의와 인권을 위해 연대해 온 대표적인 교회',
          },
        ],
      },
    ],
  },
  {
    slug: 'marronnier-park',
    shortName: '마로니에공원',
    name: '마로니에공원',
    region: '종로구',
    address: '서울 종로구 대학로8길 1',
    category: '공원 · 열린 공간',
    tagline: '학생들이 자유를 외치며 거리로 나선 곳',
    summary:
      '지금의 마로니에공원은 공연과 문화예술의 공간이지만, 1960년 4·19혁명 당시에는 서울대학교 문리과대학이 있던 곳이었습니다. 이곳에서는 학생들이 독재에 맞서 거리로 나섰고, 며칠 뒤에는 전국 대학교수들이 "학생의 피에 보답하라"는 시국선언을 발표하며 민주주의 회복을 촉구했습니다. 학생과 시민, 교수들이 함께 역사를 바꾼 곳이자, 민주주의를 향한 용기가 시작된 공간입니다.',
    photoGuide: '마로니에 나무나 상징 조형물이 보이게 한 장 담아 주세요. 구도는 자유롭게요.',
    courseOrder: 4,
    markColor: 'lime',
    sections: [
      { type: 'map' },
      {
        type: 'nearby',
        points: [
          {
            name: '동성고등학교',
            desc: '4·19혁명 당시 학생들이 거리로 나섰던 대표적인 학교 중 하나',
          },
          {
            name: '한국기독교회관',
            desc: '민주화운동과 인권운동의 중요한 거점 역할을 했던 공간',
          },
        ],
      },
    ],
  },
  {
    slug: 'jeon-taeil-bridge',
    shortName: '전태일다리',
    name: '전태일다리',
    region: '종로구',
    address: '서울 종로구 청계천로 (버들다리)',
    category: '다리 · 기억 공간',
    tagline: '한 사람의 외침이 세상을 바꾸다',
    summary:
      '청계천 평화시장 인근의 전태일다리는 노동과 인권을 이야기할 때 가장 먼저 떠오르는 장소입니다. 1970년 평화시장 재단사였던 전태일은 "근로기준법을 준수하라"는 외침과 함께 자신의 몸을 불살랐습니다. 그의 희생은 열악한 노동 현실을 세상에 알렸고, 이후 노동운동과 민주화운동의 중요한 출발점이 되었습니다. 오늘날 청계천을 걸으며 전태일 동상과 그의 정신을 기억하는 공간들을 만나보세요.',
    photoGuide: '전태일 동상이나 다리 이름 표지가 보이게 찍어 주세요.',
    courseOrder: 5,
    markColor: 'purple',
    sections: [
      { type: 'map' },
      {
        type: 'nearby',
        points: [
          {
            name: '평화시장',
            desc: '전태일이 재단사로 일했던 노동운동의 출발점',
          },
          {
            name: '전태일기념관',
            desc: '전태일의 삶과 노동·인권의 역사를 만날 수 있는 공간',
          },
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
    tagline: '시대마다 시민들이 모인 민주주의의 광장',
    summary:
      '광화문은 조선시대부터 오늘날까지 대한민국의 정치와 행정의 중심지였습니다. 자연스럽게 시민들이 가장 먼저 모여 목소리를 내는 장소가 되었고, 한국 현대사의 결정적인 순간마다 역사의 중심에 있었습니다. 4·19혁명, 6월 민주항쟁, 촛불집회까지. 시대는 달라졌지만 시민들은 언제나 광장에 모여 민주주의를 이야기했습니다.',
    photoGuide: '광장 전경이나 대표 조형물이 보이게 담아 주세요.',
    courseOrder: 6,
    markColor: 'orange', // 확정 — 시안 `02 내 방문기록`
    sections: [
      { type: 'map' },
      {
        type: 'nearby',
        points: [
          {
            name: '대한성공회 서울주교좌성당',
            desc: '민주화운동 당시 시민들의 피난처이자 연대의 공간',
          },
          {
            name: '서울특별시의회 본관(구 경성부민관)',
            desc: '해방 전후 독립과 민주주의의 역사를 품은 공간. 본관 앞에 4·19혁명을 기억하는 표석이 있다',
          },
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
