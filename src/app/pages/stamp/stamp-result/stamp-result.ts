import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Space } from '../../../core/models';
import { WaveDivider } from '../../../shared/layout/wave-divider/wave-divider';
import { LazyLoadImg } from '../../../shared/ui/lazy-load-img/lazy-load-img';
import { RewardNotice } from '../../../shared/ui/reward-notice/reward-notice';
import { StampBadge } from '../../../shared/ui/stamp-badge/stamp-badge';

/**
 * 사진 업로드 후 결과 화면의 상태.
 * 시안 `08` 계열 6장은 골격이 같고 문구·CTA 만 달라 한 컴포넌트로 통합. 분기는 이 값 하나.
 */
export type StampResultStatus =
  | 'success' // 08 정상 적립
  | 'reward' // 08 적립 + 받을 수 있는 리워드 있음
  | 'already' // 08b 이미 인증한 장소
  | 'closed' // 08c 운영 기간 아님
  | 'invalid' // 08c 확인할 수 없는 주소
  | 'failed'; // 08d 저장 실패

export const STAMP_RESULT_STATUSES: readonly StampResultStatus[] = [
  'success',
  'reward',
  'already',
  'closed',
  'invalid',
  'failed',
] as const;

/** CTA 클릭 시 부모가 받는 신호. 이동·재시도 처리는 화면 담당 */
export type StampResultAction =
  | 'viewStamps'
  | 'viewRewards'
  | 'viewSpaces'
  | 'viewHelp'
  | 'goMain'
  | 'retry'
  | 'close';

/** 결과 화면 CTA 하나 */
interface ResultAction {
  action: StampResultAction;
  label: string;
  variant: 'primary' | 'secondary';
}

/** status 에서 계산한 표시 내용. 템플릿은 이 값만 참조 */
interface ResultView {
  /** 원형 안의 기호. 없으면 빈 문자열 */
  mark: string;
  title: string;
  /** 원형 아래 보조 문구. 한 항목이 한 줄 */
  descriptions: readonly string[];
  /** 테두리 박스로 감싸는 안내 문구 */
  boxedDescription: string;
  showRewardCard: boolean;
  actions: readonly ResultAction[];
}

@Component({
  selector: 'app-stamp-result',
  imports: [LazyLoadImg, RewardNotice, StampBadge, WaveDivider],
  templateUrl: './stamp-result.html',
  styleUrl: './stamp-result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StampResult {
  readonly status = input.required<StampResultStatus>();

  readonly stampCount = input(0);
  readonly totalCount = input(0);

  /** 방금 인증한 장소. 적립 화면의 사진·도장이 쓴다 — 나머지 상태에서는 미사용 */
  readonly space = input<Space | null>(null);

  /** 적립됐지만 신청할 선물이 없을 때 다음 조건 안내. 문구는 화면(stamp)이 정한다 */
  readonly rewardGuide = input('');

  readonly actionSelect = output<StampResultAction>();

  /** 적립 직후 두 상태만 시안 1a·1b 의 「방문을 기록했어요」 구조를 쓴다 */
  protected readonly isRecorded = computed(
    () => this.status() === 'success' || this.status() === 'reward',
  );

  protected readonly view = computed<ResultView>(() => this.buildView());

  private buildView(): ResultView {
    const base: ResultView = {
      mark: '',
      title: '',
      descriptions: [],
      boxedDescription: '',
      showRewardCard: false,
      actions: [],
    };

    switch (this.status()) {
      case 'success':
        return {
          ...base,
          title: '방문을 기록했어요',
          actions: [
            { action: 'viewStamps', label: '내 방문 기록 보기', variant: 'primary' },
            { action: 'viewSpaces', label: '다음 방문할 곳 보기', variant: 'secondary' },
          ],
        };

      case 'reward':
        return {
          ...base,
          title: '방문을 기록했어요',
          showRewardCard: true,
          actions: [
            { action: 'viewStamps', label: '내 방문 기록 보기', variant: 'primary' },
            { action: 'viewRewards', label: '참여 선물 보기', variant: 'secondary' },
          ],
        };

      case 'already':
        return {
          ...base,
          mark: '!',
          title: '이미 인증한 장소예요',
          descriptions: ['한 장소는 한 번만 적립됩니다.'],
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
          title: '확인할 수 없는 장소예요',
          boxedDescription: '존재하지 않는 장소이거나 주소가 잘못됐을 수 있어요.',
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

}
