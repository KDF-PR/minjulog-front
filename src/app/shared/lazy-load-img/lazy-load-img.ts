import { Component, computed, input } from '@angular/core';
import { LazyLoadImageModule } from 'ng-lazyload-image';

/**
 * 지연 로딩 이미지 — 기본 경로만 넘기면 @0.5x(placeholder) → @2x(실제)로 자동 구성.
 *
 * 사용:
 *   <lazyLoadImg [src]="'assets/images/ui/graphics/result/guest_kya'" alt="MC 김윤아" />
 * 렌더:
 *   <img [defaultImage]="'assets/…/guest_kya@0.5x.png'" [lazyLoad]="'assets/…/guest_kya@2x.png'" alt="MC 김윤아" />
 *
 * `:host { display: contents }` 라 래퍼가 레이아웃에 끼지 않아 기존 img 스타일이 그대로 적용된다.
 * (LazyLoadImageModule은 SHARED_IMPORTS에 있으므로 어느 컴포넌트에서나 사용 가능)
 */
@Component({
  selector: 'lazyLoadImg',
  imports: [LazyLoadImageModule],
  template: `<img [defaultImage]="placeholder()" [lazyLoad]="full()" [alt]="alt()" />`,
  styles: [
    `
      :host { display: contents; }
      img {
        width: 100%;
        max-width: 100%;
        object-fit: contain;
      }

    `],
})
export class LazyLoadImg {
  /** 배율·확장자 suffix를 뺀 이미지 기본 경로 */
  readonly src = input.required<string>();
  /** 대체 텍스트 (선택 — 장식 이미지는 생략하면 빈 alt) */
  readonly alt = input('');
  /** 확장자 (기본 png) */
  readonly ext = input('png');

  protected readonly placeholder = computed(() => `${this.src()}@0.5x.${this.ext()}`);
  protected readonly full = computed(() => `${this.src()}@2x.${this.ext()}`);
}
