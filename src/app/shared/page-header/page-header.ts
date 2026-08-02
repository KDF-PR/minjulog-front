import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * 탭 화면 세 곳(내 스탬프 · 방문할 곳 · 리워드)과 장소 상세가 공유하는 상단 헤더.
 *
 * 워드마크와 `소개` 칩만 담는다. 소개 내용은 화면마다 다르지 않지만 dialog 를 여는
 * 주체가 화면이라 여기서는 알리기만 한다 — 헤더가 dialog 를 직접 들고 있으면
 * 화면 세 곳이 각자 dialog 인스턴스를 만들게 된다.
 *
 * 워드마크는 메인으로 가는 링크다. 이동은 여기서 직접 한다 — 어느 화면에 붙어도
 * 목적지가 같아서 화면마다 다시 정할 이유가 없다.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  /** 워드마크 자리 문구. 자산 export 를 받으면 이미지로 바뀐다 */
  readonly title = input('민주로그');

  /** `소개` 칩을 눌렀다 */
  readonly introSelect = output<void>();
}
