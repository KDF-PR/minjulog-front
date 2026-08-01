import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { TabBar } from '../../shared/tab-bar/tab-bar';
import { IntroDialog } from '../../shared/intro-dialog/intro-dialog';
import { RewardNotice } from '../../shared/reward-notice/reward-notice';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import { SpaceService } from '../../core/space.service';
import { LoadState, REWARD_TIERS } from '../../core/models';

/**
 * 02 내 스탬프 — 진행률과 스탬프 그리드.
 *
 * 개수·진행률은 전부 `SpaceService` 의 computed 에서 파생시킨다. 화면이 따로 세면
 * 목록과 진행률이 어긋난다.
 *
 * 리워드 자격은 서버 판정(`RewardService.eligibleTiers`)을 따른다. 방문 수로 화면에서
 * 다시 계산하지 않는다 (`app.py:540` 재계산이 최종).
 */
@Component({
  selector: 'app-my-log',
  imports: [PageHeader, TabBar, IntroDialog, RewardNotice],
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
  protected readonly introOpen = signal(false);

  protected readonly spaceVisits = this.spaces.spaceVisits;
  protected readonly visitedCount = this.spaces.visitedCount;
  protected readonly totalCount = this.spaces.totalCount;

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
