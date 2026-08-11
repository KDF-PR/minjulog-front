import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IntroDialog } from '../../ui/intro-dialog/intro-dialog';

/**
 * 탭 화면 세 곳과 장소 상세가 공유하는 상단 헤더.
 * `소개` dialog 를 여는 상태까지 여기서 든다 — 헤더를 쓰는 화면 여섯 곳이
 * 같은 signal 과 태그를 각각 들고 있었다.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink, IntroDialog],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  /** 워드마크 자리 문구. 자산 export 를 받으면 이미지로 바뀐다 */
  readonly title = input('민주로그');

  protected readonly introOpen = signal(false);

  protected openIntro(): void {
    this.introOpen.set(true);
  }

  protected closeIntro(): void {
    this.introOpen.set(false);
  }
}
