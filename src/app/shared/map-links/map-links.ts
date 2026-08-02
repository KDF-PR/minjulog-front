import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** 지도 앱 한 곳. 주소를 검색어로 넘기는 형태라 앱마다 주소 조립 규칙만 다르다 */
interface MapLink {
  label: string;
  url: string;
}

/**
 * 지도 앱 링크 세 개. `방문할 곳` 목록 하단과 장소 상세 「찾아가는 길」이 함께 쓴다.
 *
 * 좌표가 아니라 **검색어**를 넘긴다. 세 앱 모두 좌표 링크 규격이 달라 한 벌로 못 맞추고,
 * 장소 데이터에 좌표가 없는 곳이 있어서다 (`SpaceContent.coords` 는 선택 항목).
 */
@Component({
  selector: 'app-map-links',
  imports: [],
  templateUrl: './map-links.html',
  styleUrl: './map-links.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapLinks {
  /** 지도 앱에 넘길 검색어. 보통 장소 주소나 이름이다 */
  readonly query = input.required<string>();

  protected readonly links = computed<readonly MapLink[]>(() => {
    const keyword = encodeURIComponent(this.query());

    return [
      { label: '구글맵', url: `https://www.google.com/maps/search/?api=1&query=${keyword}` },
      { label: '카카오맵', url: `https://map.kakao.com/link/search/${keyword}` },
      { label: '네이버지도', url: `https://map.naver.com/p/search/${keyword}` },
    ];
  });
}
