import { Component, computed, input } from '@angular/core';
import { LazyLoadImageModule } from 'ng-lazyload-image';

/**
 * 지연 로딩 이미지. 기본 경로만 넘기면 @0.5x(placeholder) → @2x(실제)로 구성한다.
 * `:host { display: contents }` 라 래퍼가 레이아웃에 끼지 않는다.
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
  /** 대체 텍스트. 장식 이미지는 생략해 빈 alt 로 둔다 */
  readonly alt = input('');
  /** 확장자 (기본 png) */
  readonly ext = input('png');

  protected readonly placeholder = computed(() => `${this.src()}@0.5x.${this.ext()}`);
  protected readonly full = computed(() => `${this.src()}@2x.${this.ext()}`);
}
