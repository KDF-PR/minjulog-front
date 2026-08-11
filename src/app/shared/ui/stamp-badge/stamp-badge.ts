import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StampMark } from '../../../core/models';

/** 배지 그림 종류. 이름은 모양을 가리킨다 */
export type StampBadgeVariant = 'stamp' | 'flower';

/**
 * 장소의 방문 여부를 알리는 배지. 화면마다 SVG 를 다시 적지 않도록 한 컴포넌트에 모았다.
 *
 * `stamp` 는 「방문완료」 도장(48×48, Figma `badge_visited`),
 * `flower` 는 목록 줄머리의 작은 꽃(32×32, Figma `badge_small`)이다.
 * 색은 host 의 `data-mark` 를 보고 `stamp-badge.scss` 가 정한다. 방문 전에는 `data-mark`
 * 를 붙이지 않는다 — 장소 색은 방문한 뒤에만 드러나야 한다.
 * 방문 전 그림은 회색 고정의 별도 자산(`badge_inactive` / `badge_small_inactive`)이라
 * `currentColor` 가 없다.
 *
 * 글자가 그림이라 host 의 `aria-label` 이 대신 알린다. 방문 여부를 이미 글로 적어 둔
 * 화면은 붙는 쪽에서 `aria-hidden="true"` 로 덮는다. 크기·자리도 붙는 쪽이 덮는다.
 */
@Component({
  selector: 'app-stamp-badge',
  templateUrl: './stamp-badge.html',
  styleUrl: './stamp-badge.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-mark]': 'visited() ? mark() : null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StampBadge {
  /** 장소에 배정된 색. 방문 전에는 쓰이지 않지만 장소가 늘 들고 있는 값이라 항상 받는다 */
  readonly mark = input.required<StampMark>();

  /** 그림 종류. 도장을 쓰는 화면이 더 많아 기본값을 `stamp` 으로 둔다 */
  readonly variant = input<StampBadgeVariant>('stamp');

  /** 방문 여부. 방문 완료에만 배지를 다는 화면이 있어 기본값을 방문 완료로 둔다 */
  readonly visited = input(true);

  protected readonly label = computed(() => (this.visited() ? '방문 완료' : '방문 전'));
}
