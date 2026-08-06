import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * 화면에 들어올 때 스크롤을 맨 위로 되돌린다. 스크롤하는 요소에 직접 붙인다 —
 * 창이 아니라 화면 안쪽 div 가 스크롤해 라우터의 `scrollPositionRestoration` 이 닿지 않는다.
 *
 * 첫 렌더 뒤와 `NavigationEnd` 두 시점에 되돌린다. 둘째가 필요한 이유는
 * `/spaces/a` → `/spaces/b` 처럼 컴포넌트가 재사용되면 스크롤이 그대로 남아서다.
 */
@Directive({
  selector: '[appScrollTop]',
})
export class ScrollTopDirective {
  private element = inject<ElementRef<HTMLElement>>(ElementRef);
  private router = inject(Router);

  constructor() {
    afterNextRender(() => this.toTop());

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.toTop());
  }

  /** 스크롤이 없는 요소에 붙어도 0 대입은 아무 일도 하지 않는다 */
  private toTop(): void {
    this.element.nativeElement.scrollTop = 0;
  }
}
