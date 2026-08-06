import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { TabBar } from '../../shared/tab-bar/tab-bar';
import { IntroDialog } from '../../shared/intro-dialog/intro-dialog';
import { WaveDivider } from '../../shared/wave-divider/wave-divider';
import { AuthService } from '../../auth/auth.service';
import { RETURN_URL_PARAM } from '../../auth/auth.guard';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import { SpaceService } from '../../core/space.service';
import { LoadState, REWARD_TIERS, RewardTier } from '../../core/models';
import { OPERATION_PERIOD } from '../../core/spaces.content';
import { ScrollTopDirective } from '../../utils/scroll-top.directive';

/** 선물 한 단계에 붙는 문구. 시안 R1 의 값을 그대로 옮겼다 — 확정 문구가 오면 여기만 바뀐다 */
interface RewardContent {
  /** 절 제목 — 「첫 번째 선물」 */
  order: string;
  /** 받는 조건 한 줄 */
  condition: string;
  name: string;
  description: string;
}

const REWARD_CONTENT: Record<RewardTier, RewardContent> = {
  3: {
    order: '첫 번째 선물',
    condition: '민주화운동기념관을 포함해 3곳 방문시 증정',
    name: '민주화 기념 마그넷',
    description: '서울을 배경으로 민주화운동 관련 장소가 새겨진 마그넷이예요.',
  },
  6: {
    order: '두 번째 선물',
    condition: '6곳 모두 방문시 증정',
    name: '민주화 기념 키링',
    description: '민주화운동을 상징하는 여섯 개의 상징물로 구성된 금속 키링이예요.',
  },
};

/** 화면에 그리는 선물 한 단계 — 시안 문구와 서버가 준 자격을 합친 값 */
interface RewardItem extends RewardContent {
  tier: RewardTier;
  claimable: boolean;
  claimed: boolean;
  ctaLabel: string;
}

function toCtaLabel(claimed: boolean, claimable: boolean, remaining: number): string {
  if (claimed) return '받은 리워드 확인';
  if (claimable) return '리워드 받기';
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
  imports: [PageHeader, TabBar, IntroDialog, WaveDivider, ScrollTopDirective],
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
  protected readonly introOpen = signal(false);
  protected readonly claimingTier = signal<RewardTier | null>(null);
  protected readonly issuedCode = signal<string | null>(null);
  protected readonly claimError = signal<string | null>(null);

  protected readonly periodLabel = OPERATION_PERIOD.label;
  

  protected readonly visitedCount = this.spaces.visitedCount;

  /** 로그인 여부. 「리워드 받기」를 눌렀을 때 게이트로 보낼지 가른다 */
  protected readonly isSignedIn = computed(() => this.auth.currentUser() !== null);

  /** 다음 선물까지 남은 스탬프 수. 모든 단계를 지났으면 0 */
  protected readonly remainingToReward = computed(() => {
    const visited = this.visitedCount();
    const nextTier = REWARD_TIERS.find((tier) => tier > visited);
    return nextTier ? nextTier - visited : 0;
  });

  /** 선물 두 단계. 문구는 화면 상수, 자격은 서버 값을 쓴다 */
  protected readonly rewardItems = computed<readonly RewardItem[]>(() =>
    REWARD_TIERS.map((tier) => {
      const claimable = this.rewards.canClaim(tier);
      const claimed = this.rewards.hasClaimed(tier);
      const remaining = Math.max(tier - this.visitedCount(), 0);

      return {
        ...REWARD_CONTENT[tier],
        tier,
        claimable,
        claimed,
        ctaLabel: toCtaLabel(claimed, claimable, remaining),
      };
    }),
  );

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.load();
  }

  protected openIntro(): void {
    this.introOpen.set(true);
  }

  protected closeIntro(): void {
    this.introOpen.set(false);
  }

  /**
   * 같은 tier 를 다시 눌러도 코드는 바뀌지 않고, 자격 미달이면 403 이 온다.
   * 로그인은 여기서 묻는다 — 돌아올 자리를 `returnUrl` 로 들려 보낸다.
   */
  protected claim(tier: RewardTier): void {
    if (!this.isSignedIn()) {
      this.router.navigate(['/gate'], { queryParams: { [RETURN_URL_PARAM]: '/reward' } });
      return;
    }

    if (this.claimingTier() !== null) return;
    this.claimingTier.set(tier);
    this.claimError.set(null);

    this.rewards.claimReward(tier).subscribe({
      next: (reward) => {
        this.issuedCode.set(reward.code);
        this.claimingTier.set(null);
      },
      error: (err) => {
        // 백엔드가 한국어 메시지를 { error: "..." } 로 준다. 분기는 상태코드로만 한다
        this.claimError.set(err?.error?.error ?? '리워드를 받지 못했어요.');
        this.claimingTier.set(null);
      },
    });
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
