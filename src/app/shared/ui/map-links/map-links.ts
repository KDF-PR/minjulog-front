import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpaceMapLinks } from '../../../core/models';

/** 지도 앱 링크 한 곳 */
interface MapLink {
  label: string;
  url: string;
}

/**
 * 지도 앱 링크 세 개. 좌표가 아니라 검색어를 넘긴다 — 앱마다 좌표 링크 규격이 다르고
 * 좌표 없는 장소가 있다 (`SpaceContent.coords` 는 선택 항목).
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

  /** 앱별 확정 주소(`SpaceSection.mapLinks`). 값이 있는 앱은 검색어 링크 대신 이걸 쓴다 */
  readonly urls = input<SpaceMapLinks | undefined>(undefined);

  protected readonly links = computed<readonly MapLink[]>(() => {
    const keyword = encodeURIComponent(this.query());
    const urls = this.urls();

    return [
      { label: '네이버지도', url: urls?.naver ?? `https://map.naver.com/p/search/${keyword}` },
      { label: '카카오맵', url: urls?.kakao ?? `https://map.kakao.com/link/search/${keyword}` },
      {
        label: '구글맵',
        url: urls?.google ?? `https://www.google.com/maps/search/?api=1&query=${keyword}`,
      },
    ];
  });
}
