/**
 * 리워드 신청 다이얼로그 — 시안 「선물신청 2c」 (2b 의 문구·단계 정리판).
 *
 * **정상 경로에서 「코드」라는 단어를 쓰지 않는다.** 코드는 구글폼에 자동으로
 * 채워지는 내부 값이라, 프리필이 실패한 사람에게만(`codecheck`) 보여준다.
 * 안내(intro) 단계도 없다 — 카드의 「신청하기」가 곧 발급 요청이다.
 *
 * 표시 전용 — 발급 요청·폼 열기·닫기는 전부 부모(`Reward`)가 output 으로 받는다.
 * 골격은 `templates/_dialog.scss`, 상태 전환은 `phase` 입력 하나로 가른다.
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { LazyLoadImg } from '../../../shared/ui/lazy-load-img/lazy-load-img';

/**
 * 다이얼로그 단계. 성공 후 화면은 `formUrl` 이 가른다 —
 * 있으면 `issued`(폼으로 보내기), 없으면 `codecheck`(코드만 표시).
 */
export type ClaimPhase = 'loading' | 'issued' | 'codecheck' | 'error';

@Component({
  selector: 'app-reward-claim-dialog',
  imports: [A11yModule, LazyLoadImg],
  templateUrl: './reward-claim-dialog.html',
  styleUrl: './reward-claim-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RewardClaimDialog {
  readonly open = input(false);
  readonly phase = input.required<ClaimPhase>();
  /** 어느 단계인지 — 「첫 번째 선물」. 무엇을 받는지는 `image` 가 보여준다 */
  readonly badgeLabel = input('');
  /** 선물 사진 기본 경로. `lazyLoadImg` 가 `@0.5x` · `@2x` 를 붙인다 */
  readonly image = input<string | null>(null);
  readonly code = input<string | null>(null);
  readonly formUrl = input<string | null>(null);
  /**
   * 「받은 리워드 확인」으로 다시 연 상태.
   * 제출 여부는 시스템이 모른다(구글폼) — 그 한계를 제목 문구가 흡수한다.
   */
  readonly reopened = input(false);
  /** 발급 실패 시 서버 문장. 표시용으로만 쓴다 — 분기는 부모가 상태코드로 */
  readonly errorMessage = input<string | null>(null);

  /** 「다시 시도」 — 코드 발급 요청은 부모 담당 */
  readonly apply = output<void>();
  /** 「신청서 작성하기」·「다시 열기」 — 구글폼 열기는 부모 담당 */
  readonly openForm = output<void>();
  readonly showCode = output<void>();
  readonly backToIssued = output<void>();
  readonly close = output<void>();

  /** 「코드 복사」 직후 1.6초 「복사했어요」 플래시 */
  protected readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialogEl');
  /** 다이얼로그를 연 요소. 닫을 때 포커스 복귀 지점 */
  private opener: HTMLElement | null = null;

  constructor() {
    // 포커스 이동은 photo-guide-sheet 와 같은 방식 — cdkTrapFocusAutoCapture 는
    // preventScroll 없이 포커스를 줘 조상 스크롤이 튄다
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (this.open() && dialog) {
        this.opener ??=
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.focus({ preventScroll: true });
      } else if (!this.open() && this.opener) {
        this.opener.focus({ preventScroll: true });
        this.opener = null;
        this.copied.set(false);
      }
    });
  }

  /** 딤 클릭·Esc. 발급 중에는 막는다 — 버튼도 없는 화면이라 요청이 끝나야 움직인다 */
  protected requestClose(): void {
    if (this.phase() === 'loading') return;
    this.close.emit();
  }

  protected copy(): void {
    const code = this.code();
    if (!code) return;
    // 실패해도 화면 흐름을 막지 않는다 — 코드가 보이므로 손으로 옮길 수 있다
    navigator.clipboard?.writeText(code).catch(() => {});
    this.copied.set(true);
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set(false), 1600);
  }
}
