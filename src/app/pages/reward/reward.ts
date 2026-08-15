import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { TabBar } from '../../shared/layout/tab-bar/tab-bar';
import { WaveDivider } from '../../shared/layout/wave-divider/wave-divider';
import { AuthService } from '../../auth/auth.service';
import { RETURN_URL_PARAM } from '../../auth/auth.guard';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import { SpaceService } from '../../core/space.service';
import { LoadState, REWARD_TIERS, RewardCode, RewardTier } from '../../core/models';
import { OPERATION_PERIOD } from '../../core/spaces.content';
import { ScrollTopDirective } from '../../shared/directives/scroll-top.directive';
import { LazyLoadImg } from '../../shared/ui/lazy-load-img/lazy-load-img';
import { ClaimPhase, RewardClaimDialog } from './reward-claim-dialog/reward-claim-dialog';

/** 선물 한 단계에 붙는 문구. 시안 R1 의 값을 그대로 옮겼다 — 확정 문구가 오면 여기만 바뀐다 */
interface RewardContent {
  /** 절 제목 — 「첫 번째 선물」 */
  order: string;
  /** 받는 조건 한 줄 */
  condition: string;
  name: string;
  description: string;
  /** 선물 사진 기본 경로. `lazyLoadImg` 가 `@0.5x` · `@2x` 를 붙인다 */
  image: string;
}

const REWARD_CONTENT: Record<RewardTier, RewardContent> = {
  3: {
    order: '첫 번째 선물',
    condition: '민주화운동기념관 포함 3곳 방문시 증정',
    name: '민주화 기념 마그넷',
    description: '서울을 배경으로 민주화운동 관련 장소가 새겨진 마그넷이예요.',
    image: '/assets/images/rewards/reward_a',
  },
  6: {
    order: '두 번째 선물',
    condition: '6곳 모두 방문시 증정',
    name: '민주화 기념 키링',
    description: '민주화운동을 상징하는 여섯 개의 상징물로 구성된 금속 키링이예요.',
    image: '/assets/images/rewards/reward_b',
  },
};

/**
 * 선물을 못 받는 이유. 잠긴 까닭이 둘이라 `claimable: false` 하나로는 문구를 고를 수 없다.
 *
 *   count     아직 방문 수가 모자람
 *   required  개수는 채웠지만 필수 장소를 안 감
 */
type LockReason = 'count' | 'required';

/** 화면에 그리는 선물 한 단계 — 시안 문구와 서버가 준 자격을 합친 값 */
interface RewardItem extends RewardContent {
  tier: RewardTier;
  claimable: boolean;
  claimed: boolean;
  /** 받을 수 있거나 이미 받았으면 null */
  lock: LockReason | null;
  ctaLabel: string;
}

function toCtaLabel(item: Omit<RewardItem, 'ctaLabel'>, remaining: number): string {
  // 코드를 받았어도 「신청하기」 유지 — 구글폼 제출 여부를 시스템이 몰라
  // 「받은 리워드 확인」처럼 끝난 듯한 라벨을 달 수 없다. 다시 누르면 같은 코드가 나온다
  if (item.claimable || item.claimed) return '신청하기';
  if (item.lock === 'required') return '필수 장소 방문이 필요해요';
  return `${remaining}곳 더 방문하면 받을 수 있어요`;
}

/**
 * 04 리워드 — 선물 두 단계를 절로 나눠 보여주는 화면.
 *
 * 자격 판정은 서버(`RewardService.canClaim()`) 몫이라 방문 수로 다시 계산하지 않는다.
 * 가드 없이 열리고 로그인은 「리워드 받기」에서만 묻는다.
 */
@Component({
  selector: 'app-reward',
  imports: [PageHeader, TabBar, WaveDivider, ScrollTopDirective, LazyLoadImg, RewardClaimDialog],
  templateUrl: './reward.html',
  styleUrl: './reward.scss',
})
export class Reward implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private spaces = inject(SpaceService);
  private photos = inject(PhotoService);
  private rewards = inject(RewardService);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);
  protected readonly loadState = signal<LoadState>('idle');

  /** 신청 다이얼로그가 다루는 tier. null 이면 닫힘 */
  protected readonly claimTier = signal<RewardTier | null>(null);
  protected readonly claimPhase = signal<ClaimPhase>('loading');
  /** 「받은 리워드 확인」으로 다시 연 것인지 — 다이얼로그 문구가 갈린다 */
  protected readonly claimReopened = signal(false);
  /** 발급받은 코드. `formUrl` 까지 들고 있어야 「신청서 작성하기」가 열 수 있다 */
  protected readonly issuedReward = signal<RewardCode | null>(null);
  protected readonly claimError = signal<string | null>(null);

  /** 다이얼로그 배지 — 「첫 번째 선물」. 무엇인지는 배지 아래 선물 사진이 보여준다 */
  protected readonly claimBadge = computed(() => {
    const tier = this.claimTier();
    return tier ? REWARD_CONTENT[tier].order : '';
  });

  /** 다이얼로그에 띄울 선물 사진 — 카드와 같은 자산을 쓴다 */
  protected readonly claimImage = computed(() => {
    const tier = this.claimTier();
    return tier ? REWARD_CONTENT[tier].image : null;
  });

  protected readonly periodLabel = OPERATION_PERIOD.label;

  protected readonly visitedCount = this.spaces.visitedCount;

  /** 로그인 여부. 「리워드 받기」를 눌렀을 때 게이트로 보낼지 가른다 */
  protected readonly isSignedIn = computed(() => this.auth.currentUser() !== null);

  protected readonly remainingToReward = this.spaces.remainingToReward;

  /** 필수 장소 이름. 응답 전에도 프론트 콘텐츠에서 채워진다 */
  private readonly requiredName = computed(
    () => this.spaces.requiredSpace()?.shortName ?? '필수 장소',
  );

  /**
   * 자격 판정을 아직 못 받은 상태.
   *
   * **`loadState` 가 아니라 서버 응답 유무로 본다.** 화면 콘텐츠(선물 이름·사진·조건)는
   * 전부 프론트 상수라 응답 전에도 그릴 수 있고, 서버가 정하는 것은 자격뿐이다.
   * 다른 화면에서 넘어와 이미 자격을 들고 있으면 `loading` 중에도 이 값이 false 라
   * 멀쩡한 버튼이 「확인 중」으로 되돌아가지 않는다.
   */
  private readonly isPending = computed(() => this.rewards.rewardStatus() === null);

  /**
   * 상단 안내 문구.
   *
   * **방문 수만 세지 않는다.** 필수 장소를 빼고 3곳을 돌면 첫 선물이 아직 안 열리는데,
   * 방문 수만 보면 두 번째 선물을 기준 삼아 「3개 더」라고 안내하게 된다.
   * `my-log` 와 같은 판정(`progressState`)을 써 두 화면이 다른 말을 하지 않게 한다.
   *
   * 어느 선물이 남았는지는 `nextRewardTier` 가 답한다 — 아래 카드의 절 제목(`order`)을
   * 그대로 불러 써서 안내와 카드가 같은 이름을 가리킨다.
   *
   * 판정 전에는 방문 수에 기댄 문장을 쓰지 않는다 — 0곳으로 계산해 「3개 더」라고 적으면
   * 이미 3곳을 돈 사람에게 틀린 말을 보여줬다가 뒤집는 셈이 된다.
   */
  protected readonly introDesc = computed(() => {
    if (this.isPending()) return '방문 기록을 확인하고 있어요.';

    switch (this.spaces.progressState()) {
      case 'requiredMissing':
        return `${this.requiredName()}에 방문해야 첫 선물을 받을 수 있어요.`;
      case 'allComplete':
        return '받을 수 있는 선물을 확인해보세요.';
      default: {
        const tier = this.spaces.nextRewardTier();
        return tier
          ? `${this.remainingToReward()}개 더 모으면 ${REWARD_CONTENT[tier].order}을 받을 수 있어요.`
          : '받을 수 있는 선물을 확인해보세요.';
      }
    }
  });

  /**
   * 선물 두 단계. 문구는 화면 상수, 자격은 서버 값을 쓴다.
   *
   * 판정 전에도 같은 개수·같은 모양으로 그린다 — 응답이 와도 자리가 밀리지 않고
   * 버튼 글자와 안내 한 줄만 바뀐다. 그때 잠긴 이유(`lock`)는 아직 모르므로 비워 둔다.
   */
  protected readonly rewardItems = computed<readonly RewardItem[]>(() =>
    REWARD_TIERS.map((tier) => {
      const pending = this.isPending();
      const claimable = this.rewards.canClaim(tier);
      const claimed = this.rewards.hasClaimed(tier);
      const remaining = Math.max(tier - this.visitedCount(), 0);

      // 개수를 채웠는데도 못 받으면 남은 조건은 필수 장소뿐이다 (`app.py:530` 판정 규칙)
      const lock: LockReason | null =
        pending || claimable || claimed ? null : remaining > 0 ? 'count' : 'required';

      const item = { ...REWARD_CONTENT[tier], tier, claimable, claimed, lock };
      return { ...item, ctaLabel: pending ? '확인 중이에요' : toCtaLabel(item, remaining) };
    }),
  );

  /**
   * 잠긴 단계 옆에 붙일 안내. 필수 미방문일 때만 나온다.
   * 조사는 `에` 로 고정한다 — 장소 이름이 바뀌어도 `을/를` 처럼 갈리지 않는다.
   */
  protected readonly requiredNotice = computed(() => `먼저 ${this.requiredName()}에 방문해 주세요`);

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.load();
  }

  /**
   * 「신청하기」 — 누르는 즉시 발급을 시작한다. 안내(intro) 단계는 없다.
   * 발급은 사용자가 결정할 일이 아니라 시스템의 준비 절차라 물어볼 이유가 없고,
   * 카드에서 이미 「신청하기」를 눌렀는데 다이얼로그가 또 묻는 중복도 사라진다.
   * 로그인은 여기서 묻는다 — 돌아올 자리를 `returnUrl` 로 들려 보낸다.
   *
   * 이미 받은 tier 도 같은 길이다 — 백엔드가 같은 코드를 돌려주므로
   * (`app.py` 재요청 규칙) 「받은 리워드 확인」이 된다. 그때는 문구만 재방문용으로 바뀐다.
   */
  protected claim(tier: RewardTier): void {
    if (!this.isSignedIn()) {
      this.router.navigate(['/gate'], { queryParams: { [RETURN_URL_PARAM]: '/reward' } });
      return;
    }

    this.claimReopened.set(this.rewards.hasClaimed(tier));
    this.claimTier.set(tier);
    this.issuedReward.set(null);
    this.claimError.set(null);
    this.requestCode();
  }

  /** 발급 응답 대기 중. 「다시 시도」 연타로 요청이 겹치지 않게 막는다 */
  private claimBusy = false;

  /** 발급 요청 (「다시 시도」 겸용). 성공 화면은 `formUrl` 유무가 가른다 */
  protected requestCode(): void {
    const tier = this.claimTier();
    // phase 로 판단하면 안 된다 — 초기값이 'loading' 이라 첫 요청부터 막힌다
    if (tier === null || this.claimBusy) return;

    this.claimBusy = true;
    this.claimPhase.set('loading');
    this.claimError.set(null);

    this.rewards.claimReward(tier).subscribe({
      next: (reward) => {
        this.claimBusy = false;
        this.issuedReward.set(reward);
        this.claimPhase.set(reward.formUrl ? 'issued' : 'codecheck');
      },
      error: (err) => {
        this.claimBusy = false;
        // 백엔드가 한국어 메시지를 { error: "..." } 로 준다. 분기는 상태코드로만 한다
        this.claimError.set(err?.error?.error ?? '리워드를 받지 못했어요.');
        this.claimPhase.set('error');
      },
    });
  }

  /** 「신청서 작성하기」 — 코드가 프리필된 구글폼을 새 탭에 */
  protected openForm(): void {
    const url = this.issuedReward()?.formUrl;
    if (url) window.open(url, '_blank', 'noopener');
  }

  protected closeClaim(): void {
    this.claimTier.set(null);
  }

  /** 가드가 없어 `fetchUser` 로 로그인부터 확인한다. 미로그인은 `null` 이고 오류가 아니다 */
  private load(): void {
    this.loadState.set('loading');
    this.auth
      .fetchUser()
      .pipe(
        switchMap(() => this.spaces.loadSpaces()),
        switchMap(() => this.photos.loadVisits()),
        switchMap(() => this.rewards.loadStatus()),
      )
      .subscribe({
        next: () => this.loadState.set('ready'),
        error: () => this.loadState.set('error'),
      });
  }
}
