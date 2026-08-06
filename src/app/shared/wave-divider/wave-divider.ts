import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * 두 배경색 영역 사이에 놓는 물결 구분 요소. (Figma `wave_bar` 379×29)
 * 색·높이는 모두 CSS 변수라 `@Input()` 이 없다 — 값의 주인이 부모의 스타일시트다.
 * 쓸 수 있는 변수는 `wave-divider.scss` 머리말에 있다.
 */
@Component({
  selector: 'app-wave-divider',
  templateUrl: './wave-divider.html',
  styleUrl: './wave-divider.scss',
  // 장식이라 스크린리더에서 제외한다
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaveDivider {}
