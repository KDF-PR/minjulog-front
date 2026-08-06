/**
 * P1 사진 인증 안내 bottom sheet. 카메라를 열기 전에 장소별 예시 사진을 보여준다.
 *
 * 골격은 `templates/_bottom-sheet.scss`, 모션은 `motion-sheet-*` 클래스가 맡는다.
 * 포커스는 CDK `cdkTrapFocusAutoCapture` 가 가두고, 닫을 때 원래 자리로 되돌린다.
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { LazyLoadImg } from '../../../shared/lazy-load-img/lazy-load-img';
import { Space } from '../../../core/models';

@Component({
  selector: 'app-photo-guide-sheet',
  imports: [A11yModule, LazyLoadImg],
  templateUrl: './photo-guide-sheet.html',
  styleUrl: './photo-guide-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoGuideSheet {
  readonly open = input(false);
  readonly space = input.required<Space>();

  readonly close = output<void>();
  /** 「확인했어요」 — 부모가 촬영 화면으로 보낸다 */
  readonly confirm = output<void>();

  private readonly sheet = viewChild<ElementRef<HTMLElement>>('sheetEl');
  /** 시트를 연 요소. 닫을 때 포커스를 여기로 되돌린다 */
  private opener: HTMLElement | null = null;

  constructor() {
    // cdkTrapFocusAutoCapture 를 쓰지 않는 이유 — preventScroll 없이 포커스를 줘서
    // 슬라이드 중 화면 밖 버튼을 보이려고 조상(.step)이 149px 튀었다 돌아온다.
    // 여기서 preventScroll 로 직접 주고, 닫을 때 연 요소로 되돌린다.
    effect(() => {
      const sheet = this.sheet()?.nativeElement;
      if (this.open() && sheet) {
        this.opener ??=
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        sheet.focus({ preventScroll: true });
      } else if (!this.open() && this.opener) {
        this.opener.focus({ preventScroll: true });
        this.opener = null;
      }
    });
  }
}
