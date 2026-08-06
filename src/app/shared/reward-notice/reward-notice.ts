import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * 받을 수 있는 선물을 알리는 카드. 02 내 스탬프와 08 적립 결과가 같이 쓴다.
 * 이동은 부모가 정한다 — 라우터를 직접 부르면 두 화면이 같은 목적지로 묶인다.
 */
@Component({
  selector: 'app-reward-notice',
  templateUrl: './reward-notice.html',
  styleUrl: './reward-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RewardNotice {
  readonly title = input('받을 수 있는 선물이 있어요');
  readonly linkLabel = input('리워드 받기');

  readonly linkSelect = output<void>();
}
