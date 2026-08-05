import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StampMark } from '../../core/models';

/** 배지 그림 종류. 이름은 모양을 가리킨다 — 어느 화면이 쓰는지는 여기서 정하지 않는다 */
export type StampBadgeVariant = 'stamp' | 'flower';

/**
 * 장소의 방문 여부를 알리는 배지.
 *
 * 그림이 두 종류다. `stamp` 는 「방문완료」 글자가 들어간 도장(48×48, Figma `badge_visited`),
 * `flower` 는 목록 줄머리에 놓는 작은 꽃(32×32, Figma `badge_small`)이다.
 * 모양은 달라도 방문 여부로 갈린다는 점과 장소 색을 받아 칠한다는 점이 같아
 * 화면마다 SVG 를 다시 적지 않도록 한 컴포넌트에 모았다.
 *
 * 색은 꽃 본체만 `fill="currentColor"` 로 두고 host 의 `data-mark` 를 보고
 * `stamp-badge.scss` 가 정한다. 방문 전에는 `data-mark` 를 아예 붙이지 않는다 —
 * 장소 색은 방문한 뒤에만 드러나야 한다.
 *
 * 방문 전 그림은 종류마다 따로 있다.
 * `stamp` 은 「방문 전」 글자가 든 회색 도장(Figma `badge_inactive`),
 * `flower` 는 반짝임이 빠진 회색 꽃(Figma `badge_small_inactive`)이다.
 * 둘 다 색이 회색으로 고정이라 `currentColor` 를 쓰지 않는다.
 *
 * 글자가 그림이라 읽어 주는 기능이 문구를 못 읽는다. host 의 `aria-label` 이 대신 알린다.
 * 방문 여부를 이미 글로 적어 둔 화면은 붙는 쪽에서 `aria-hidden="true"` 로 덮는다.
 *
 * 크기는 종류별 기본값이 있고, 다르게 쓰는 화면이 붙는 쪽에서 덮는다
 * (장소 상세는 `$stamp-mark-md`). 자리도 언제나 붙는 쪽이 정한다.
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
