import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * 두 배경색 영역 사이에 놓는 물결 모양 구분 요소. (Figma `wave_bar` 379×29)
 *
 * 색과 높이는 모두 CSS 변수라 `@Input()` 이 없다. 입력을 만들면 색을 바꿀 때마다
 * 부모가 값을 들고 있어야 하는데, 이 요소는 화면 배경에 맞춰 칠해지는 장식이라
 * 값의 주인이 부모의 스타일시트다.
 *
 * 쓸 수 있는 변수는 `wave-divider.scss` 머리말에 정리돼 있다.
 */
@Component({
  selector: 'app-wave-divider',
  templateUrl: './wave-divider.html',
  styleUrl: './wave-divider.scss',
  // 장식이라 스크린리더에서 제외한다. 안에 포커스 가능한 요소가 없어
  // tabindex 를 따로 막을 필요는 없다.
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaveDivider {}
