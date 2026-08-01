import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { TabBar } from '../../shared/tab-bar/tab-bar';
import { IntroDialog } from '../../shared/intro-dialog/intro-dialog';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import { SpaceService } from '../../core/space.service';
import { LoadState, REWARD_TIERS, RewardTier } from '../../core/models';

/**
 * 선물 이름. `3` 은 시안 표기를 그대로 옮겼고 `6` 은 아직 받지 못했다.
 * 확정 문구가 오면 이 상수 한 곳만 바뀐다.
 */
const REWARD_NAMES: Record<RewardTier, string> = {
  3: '민주화 기념 마그넷 세트',
  6: '○○○○',
};

/** 타임라인 한 칸 — 스탬프 단계이거나, 그 단계에서 열리는 선물이다 */
type TimelineItem =
  | { kind: 'stamp'; key: string; name: string; earned: boolean }
  | { kind: 'reward'; key: string; tier: RewardTier; name: string; claimable: boolean; claimed: boolean };

/**
 * 04 리워드 — 스탬프 단계를 따라 선물이 열리는 화면.
 *
 * 스탬프 목록과 선물 카드를 한 줄기로 섞어 보여준다. 두 목록을 나란히 두면
 * "몇 개를 더 모으면 무엇이 열리는지"가 화면에서 끊긴다.
 *
 * **자격 판정은 서버가 한다.** 방문 수로 화면에서 다시 계산하지 않고
 * `RewardService.canClaim()` 을 따른다.
 */
@Component({
  selector: 'app-reward',
  imports: [PageHeader, TabBar, IntroDialog],
  templateUrl: './reward.html',
  styleUrl: './reward.scss',
})
export class Reward implements OnInit {
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

  protected readonly visitedCount = this.spaces.visitedCount;

  /** 다음 선물까지 남은 스탬프 수. 모든 단계를 지났으면 0 */
  protected readonly remainingToReward = computed(() => {
    const visited = this.visitedCount();
    const nextTier = REWARD_TIERS.find((tier) => tier > visited);
    return nextTier ? nextTier - visited : 0;
  });

  /** 스탬프 단계 사이에 선물 카드를 끼워 넣은 한 줄기 목록 */
  protected readonly timeline = computed<readonly TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    this.spaces.spaceVisits().forEach((item, index) => {
      items.push({
        kind: 'stamp',
        key: item.space.slug,
        name: item.space.shortName,
        earned: item.visit !== null,
      });

      const step = index + 1;
      const tier = REWARD_TIERS.find((value) => value === step);
      if (tier) {
        items.push({
          kind: 'reward',
          key: `reward-${tier}`,
          tier,
          name: REWARD_NAMES[tier],
          claimable: this.rewards.canClaim(tier),
          claimed: this.rewards.hasClaimed(tier),
        });
      }
    });

    return items;
  });

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

  /** 같은 tier 를 다시 눌러도 코드는 바뀌지 않는다. 자격 미달이면 403 이 온다 */
  protected claim(tier: RewardTier): void {
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

  private load(): void {
    this.loadState.set('loading');
    this.spaces
      .loadSpaces()
      .pipe(
        switchMap(() => this.photos.loadVisits()),
        switchMap(() => this.rewards.loadStatus()),
      )
      .subscribe({
        next: () => this.loadState.set('ready'),
        error: () => this.loadState.set('error'),
      });
  }
}
