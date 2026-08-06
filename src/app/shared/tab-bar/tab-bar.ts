import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface TabItem {
  path: string;
  label: string;
}

/**
 * 하단 탭바 — 내 방문 기록 · 방문할 곳 · 참여 선물.
 * 활성 표시는 `routerLinkActive` 의 `.is-active` 로만 가른다 — 화면이 따로 넘기면 주소와 어긋난다.
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
