import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { TabBar } from '../../shared/layout/tab-bar/tab-bar';
import { RewardNotice } from '../../shared/ui/reward-notice/reward-notice';
import { WaveDivider } from '../../shared/layout/wave-divider/wave-divider';
import { LazyLoadImg } from '../../shared/ui/lazy-load-img/lazy-load-img';
import { StampBadge } from '../../shared/ui/stamp-badge/stamp-badge';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import { SpaceService } from '../../core/space.service';
import { LoadState, REWARD_TIERS, SPACE_SLUGS } from '../../core/models';
import { ScrollTopDirective } from '../../shared/directives/scroll-top.directive';

/**
 * 02 내 스탬프 — 진행률과 스탬프 그리드.
 * 개수·진행률은 `SpaceService` 의 computed 에서만 파생시킨다 — 화면이 따로 세면 어긋난다.
 * 리워드 자격은 서버 판정(`RewardService.eligibleTiers`)을 따른다 (`app.py:540` 재계산이 최종).
 */
@Component({
  selector: 'app-my-log',
  imports: [
    RouterLink,
    PageHeader,
    TabBar,
    RewardNotice,
    WaveDivider,
    LazyLoadImg,
    StampBadge,
    ScrollTopDirective,
  ],
  templateUrl: './my-log.html',
  styleUrl: './my-log.scss',
})
export class MyLog implements OnInit {
  private spaces = inject(SpaceService);
  private photos = inject(PhotoService);
  private rewards = inject(RewardService);
  private router = inject(Router);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);
  protected readonly loadState = signal<LoadState>('idle');

  protected readonly spaceVisits = this.spaces.spaceVisits;
  protected readonly visitedCount = this.spaces.visitedCount;
  protected readonly totalCount = this.spaces.totalCount;
  protected readonly progressState = this.spaces.progressState;

  /** 0~100. 장소를 아직 못 받았으면 0 (0 나누기 방지) */
  protected readonly progressPercent = computed(() => {
    const total = this.totalCount();
    return total === 0 ? 0 : Math.round((this.visitedCount() / total) * 100);
  });

  /** 다음 선물까지 남은 스탬프 수. 모든 단계를 지났으면 0 */
  protected readonly remainingToReward = computed(() => {
    const visited = this.visitedCount();
    const nextTier = REWARD_TIERS.find((tier) => tier > visited);
    return nextTier ? nextTier - visited : 0;
  });

  protected readonly hasClaimableReward = computed(
    () => this.rewards.eligibleTiers().length > this.rewards.claimedTiers().length,
  );

  /** 필수 장소 이름. 응답 전에도 프론트 콘텐츠에서 채워진다 */
  private readonly requiredName = computed(
    () => this.spaces.requiredSpace()?.shortName ?? '필수 장소',
  );

  /**
   * 상단 안내 문구.
   *
   * **방문 수만 세지 않는다.** 필수 장소를 빼고 3곳을 돌면 첫 선물이 아직 안 열리는데,
   * 방문 수만 보면 두 번째 선물을 기준 삼아 "3곳 더" 라고 안내하게 된다.
   * 그래서 서비스의 `progressState` 판정을 그대로 따른다 (디자인 `02`~`06`).
   *
   * `inProgress` 와 `firstComplete` 는 같은 문구다 — 1차 완성 안내는 문구가 아니라
   * `RewardNotice` 배너가 맡는다.
   */
  protected readonly introDesc = computed(() => {
    switch (this.progressState()) {
      case 'empty':
        return '아래 장소를 방문하고 사진으로 인증해 보세요.';
      case 'requiredMissing':
        // 문구는 임시다 — 시안에 `04` 안내가 없다 (`docs/pages.md` 3장)
        return `${this.requiredName()}에 방문해야 첫 선물을 받을 수 있어요.`;
      case 'allComplete':
        return '여섯 곳을 모두 방문했어요.';
      default:
        return `${this.remainingToReward()}곳 더 방문하고 다음 선물도 받아요.`;
    }
  });

  /** 로딩 중 자리 채움. 장소 수는 프론트가 이미 알아 응답 전에도 실제와 같은 높이를 잡을 수 있다 */
  protected readonly placeholderSlugs = SPACE_SLUGS;

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.load();
  }

  protected goReward(): void {
    this.router.navigate(['/reward']);
  }

  /** 자격 판정이 방문 수를 읽으므로 장소·방문을 먼저 채우고 이어서 조회한다 */
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
