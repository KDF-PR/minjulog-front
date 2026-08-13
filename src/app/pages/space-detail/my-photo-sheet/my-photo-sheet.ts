/**
 * 방문 완료 후 내 인증 사진 확인 bottom sheet. 「사진 교체」가 재촬영으로 잇는다.
 * 골격은 `templates/_bottom-sheet.scss`, 모션은 `motion-sheet-*` 클래스 담당.
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
import { DatePipe } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { LazyLoadImg } from '../../../shared/ui/lazy-load-img/lazy-load-img';
import { Visit } from '../../../core/models';

@Component({
  selector: 'app-my-photo-sheet',
  imports: [A11yModule, DatePipe, LazyLoadImg],
  templateUrl: './my-photo-sheet.html',
  styleUrl: './my-photo-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPhotoSheet {
  readonly open = input(false);
  readonly visit = input.required<Visit>();

  readonly close = output<void>();
  /** 「사진 교체」 — 촬영 화면 이동은 부모 담당 */
  readonly replace = output<void>();

  private readonly sheet = viewChild<ElementRef<HTMLElement>>('sheetEl');
  /** 시트를 연 요소. 닫을 때 포커스 복귀 지점 */
  private opener: HTMLElement | null = null;

  constructor() {
    // cdkTrapFocusAutoCapture 미사용 — 이유는 photo-guide-sheet 의 같은 자리 주석 참고
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
