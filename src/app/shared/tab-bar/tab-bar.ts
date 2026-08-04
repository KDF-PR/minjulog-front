import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** 하단 탭 하나. 라우터 주소와 라벨만 갖는다 */
interface TabItem {
  path: string;
  label: string;
}

/**
 * 하단 탭바 — 내 방문 기록 · 방문할 곳 · 참여 선물.
 *
 * 활성 표시는 색 반전이 아니라 **검정 pill** 이다. `routerLinkActive` 가 붙이는
 * `.is-active` 로만 상태를 가른다 — 화면이 현재 탭을 따로 넘겨주면 주소와 표시가
 * 어긋날 수 있다.
 */
@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBar {
  protected readonly tabs: readonly TabItem[] = [
    { path: '/my-log', label: '내 방문 기록' },
    { path: '/spaces', label: '방문할 곳' },
    { path: '/reward', label: '참여 선물' },
  ];
}
