import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OPERATION_PERIOD } from '../../core/spaces.content';
import { ScrollTopDirective } from '../../utils/scroll-top.directive';

/**
 * 01 메인 — 투어 소개와 시작 지점.
 *
 * 운영 기간 문구는 `spaces.content.ts` 의 `OPERATION_PERIOD` 한 곳에서 가져온다.
 * 화면에 직접 적으면 기간이 바뀔 때 콘텐츠와 화면이 어긋난다.
 */
@Component({
  selector: 'app-main',
  imports: [RouterLink, ScrollTopDirective],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main implements OnInit {
  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);

  /** 안내 카드 본문. 시안 `main-info` 문구 그대로 */
  protected readonly tagline = '민주 · 인권 · 평화 장소를 찾아가 사진으로 인증하고 선물 받아가세요!';
  protected readonly wordmark = '민주로그';
  protected readonly subtitle = '모바일 스탬프 투어';
  protected readonly periodLabel = OPERATION_PERIOD.label;

  ngOnInit(): void {
    // DOM 을 먼저 그린 다음 프레임에서 모션을 시작한다 (첫 프레임에 붙으면 재생되지 않음)
    requestAnimationFrame(() => this.ready.set(true));
  }
}
