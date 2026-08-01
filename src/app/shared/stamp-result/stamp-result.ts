import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RewardNotice } from '../reward-notice/reward-notice';

/**
 * QR 진입·적립 결과 화면의 상태.
 *
 * 시안 `07` 과 `08` 계열 5장은 **원형 그래픽 → 제목 → 보조 문구 → CTA 1~2개** 로
 * 골격이 같고 문구와 CTA 개수만 다르다. 화면을 6개 만들면 여백·타이포·버튼 폭을
 * 여섯 곳에서 맞춰야 해 한 컴포넌트로 묶고 이 값으로만 가른다.
 */
export type StampResultStatus =
  | 'entry' // 07 QR 진입 — 아직 받기 전
  | 'success' // 08 정상 적립
  | 'reward' // 08 적립 + 받을 수 있는 리워드 있음
  | 'already' // 08b 이미 받은 스탬프
  | 'closed' // 08c 운영 기간 아님
  | 'invalid' // 08c 확인할 수 없는 QR
  | 'failed'; // 08d 저장 실패

export const STAMP_RESULT_STATUSES: readonly StampResultStatus[] = [
  'entry',
  'success',
  'reward',
  'already',
  'closed',
  'invalid',
  'failed',
] as const;

/** CTA 를 눌렀을 때 부모가 받는 신호. 이동·재시도는 화면이 정한다 */
export type StampResultAction =
  | 'claimStamp'
  | 'viewStamps'
  | 'viewRewards'
  | 'viewHelp'
  | 'goMain'
  | 'retry';

/** 결과 화면 CTA 하나 */
interface ResultAction {
  action: StampResultAction;
  label: string;
  variant: 'primary' | 'secondary';
}

/** 상태에서 계산한 표시 내용. 템플릿은 이 값만 읽는다 */
interface ResultView {
  /** `stamp` 둥근 사각형 자리표시자 · `circle` 원형 */
  graphic: 'stamp' | 'circle';
  /** 원형 안에 넣는 기호. 없으면 비운다 */
  mark: string;
  title: string;
  /** 원형 아래 보조 문구. 줄마다 한 항목 */
  descriptions: readonly string[];
  /** 테두리 박스로 감싸는 안내 문구 */
  boxedDescription: string;
  /** 받을 수 있는 리워드 안내 카드 노출 여부 */
  showRewardCard: boolean;
  actions: readonly ResultAction[];
}

@Component({
  selector: 'app-stamp-result',
  imports: [RewardNotice],
  templateUrl: './stamp-result.html',
  styleUrl: './stamp-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StampResult {
  readonly status = input.required<StampResultStatus>();

  /** `entry` 제목에 쓰는 기관 이름 */
  readonly spaceName = input('');
  /** `entry` 보조 문구에 쓰는 기관 한 줄 설명 */
  readonly spaceSummary = input('');

  readonly stampCount = input(0);
  readonly totalCount = input(0);
  /** 다음 리워드까지 남은 개수. 0 이면 문구를 내리지 않는다 */
  readonly remainingToReward = input(0);

  readonly actionSelect = output<StampResultAction>();

  protected readonly view = computed<ResultView>(() => this.buildView());

  private buildView(): ResultView {
    const base: ResultView = {
      graphic: 'circle',
      mark: '',
      title: '',
      descriptions: [],
      boxedDescription: '',
      showRewardCard: false,
      actions: [],
    };

    switch (this.status()) {
      case 'entry':
        return {
          ...base,
          graphic: 'stamp',
          title: this.spaceName(),
          descriptions: this.spaceSummary() ? [this.spaceSummary()] : [],
          actions: [{ action: 'claimStamp', label: '스탬프 받기', variant: 'primary' }],
        };

      case 'success':
        return {
          ...base,
          title: '스탬프를 받았어요',
          descriptions: [...this.rewardHint(), this.countLabel()],
          actions: this.afterClaimActions(),
        };

      case 'reward':
        return {
          ...base,
          title: '스탬프를 받았어요',
          descriptions: [this.countLabel()],
          showRewardCard: true,
          actions: this.afterClaimActions(),
        };

      case 'already':
        return {
          ...base,
          mark: '!',
          title: '이미 받은 스탬프예요',
          descriptions: ['같은 기관의 QR은 한 번만 적립됩니다.'],
          actions: [{ action: 'viewStamps', label: '내 스탬프 현황 보기', variant: 'primary' }],
        };

      case 'closed':
        return {
          ...base,
          mark: '–',
          title: '지금은 운영 기간이 아니에요',
          boxedDescription: '운영 기간 중에 다시 참여해주세요.',
          actions: [{ action: 'goMain', label: '메인으로 이동', variant: 'primary' }],
        };

      case 'invalid':
        return {
          ...base,
          mark: '–',
          title: '확인할 수 없는 QR이에요',
          boxedDescription: '존재하지 않는 기관 링크이거나 잘못된 QR일 수 있어요.',
          actions: [
            { action: 'goMain', label: '메인으로 이동', variant: 'primary' },
            { action: 'viewHelp', label: '도움말 보기', variant: 'secondary' },
          ],
        };

      case 'failed':
        return {
          ...base,
          mark: '–',
          title: '저장에 실패했어요',
          descriptions: ['네트워크 상태를 확인한 뒤 다시 시도해주세요.'],
          actions: [
            { action: 'retry', label: '다시 시도 하기', variant: 'primary' },
            { action: 'viewStamps', label: '내 스탬프 현황 보기', variant: 'secondary' },
          ],
        };
    }
  }

  /** 적립 직후 두 화면이 같은 CTA 를 쓴다 */
  private afterClaimActions(): readonly ResultAction[] {
    return [
      { action: 'viewStamps', label: '내 스탬프 보기', variant: 'primary' },
      { action: 'viewRewards', label: '리워드 보기', variant: 'secondary' },
    ];
  }

  private rewardHint(): readonly string[] {
    const remaining = this.remainingToReward();
    return remaining > 0 ? [`다음 리워드까지 ${remaining}개 남았어요`] : [];
  }

  private countLabel(): string {
    return `내 스탬프 ${this.stampCount()}/${this.totalCount()}개`;
  }
}
