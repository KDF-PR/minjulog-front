import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  StampResult,
  StampResultAction,
  StampResultStatus,
  STAMP_RESULT_STATUSES,
} from '../../shared/stamp-result/stamp-result';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import { SpaceService } from '../../core/space.service';
import { REWARD_TIERS } from '../../core/models';

/** 상태를 주소로 넘길 때 쓰는 쿼리 파라미터 이름 */
const STATUS_PARAM = 'status';

/**
 * QR 로 들어온 사람이 처음 보는 화면 (`/stamp/:slug`).
 *
 * 시안 `07` 과 `08` 계열 6장은 화면이 아니라 **한 화면의 상태**다. 이 페이지는
 * 상태를 정하고 표시는 `StampResult` 에 맡긴다 — 화면을 6개로 나누면 여백·타이포·
 * 버튼 폭을 여섯 곳에서 맞춰야 한다.
 *
 * 적립은 아직 QR 토큰 규격이 없어 붙이지 않았다. `claimStamp` 가 들어오면
 * 상태만 `success` 로 옮긴다 — 실제 호출 지점은 이 메서드 한 곳이다.
 */
@Component({
  selector: 'app-stamp',
  imports: [StampResult],
  templateUrl: './stamp.html',
  styleUrl: './stamp.scss',
})
export class Stamp implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private spaces = inject(SpaceService);
  private photos = inject(PhotoService);
  private rewards = inject(RewardService);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);
  protected readonly status = signal<StampResultStatus>('entry');

  private readonly slug = signal('');

  protected readonly space = computed(() => this.spaces.findBySlug(this.slug()));
  protected readonly spaceName = computed(() => this.space()?.name ?? '');
  protected readonly spaceSummary = computed(() => this.space()?.summary ?? '');
  protected readonly stampCount = this.spaces.visitedCount;
  protected readonly totalCount = this.spaces.totalCount;

  /** 다음 선물까지 남은 스탬프 수. 모든 단계를 지났으면 0 */
  protected readonly remainingToReward = computed(() => {
    const visited = this.stampCount();
    const nextTier = REWARD_TIERS.find((tier) => tier > visited);
    return nextTier ? nextTier - visited : 0;
  });

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.slug.set(this.route.snapshot.paramMap.get('slug') ?? '');
    this.status.set(this.readStatus());
    this.load();
  }

  protected onAction(action: StampResultAction): void {
    switch (action) {
      case 'claimStamp':
        // QR 토큰 규격 미확정 — 적립 호출을 붙이는 지점이다
        this.status.set(this.rewards.eligibleTiers().length > 0 ? 'reward' : 'success');
        return;
      case 'viewStamps':
        this.router.navigate(['/my-log']);
        return;
      case 'viewRewards':
        this.router.navigate(['/reward']);
        return;
      case 'goMain':
      case 'viewHelp':
        // 도움말 화면이 아직 없다. 메인으로 보낸다
        this.router.navigate(['/main']);
        return;
      case 'retry':
        this.status.set('entry');
        return;
    }
  }

  /** 주소로 넘어온 상태. 아는 값이 아니면 진입 화면으로 둔다 */
  private readStatus(): StampResultStatus {
    const raw = this.route.snapshot.queryParamMap.get(STATUS_PARAM);
    const known = STAMP_RESULT_STATUSES.find((value) => value === raw);
    return known ?? 'entry';
  }

  private load(): void {
    this.spaces
      .loadSpaces()
      .pipe(
        switchMap(() => this.photos.loadVisits()),
        switchMap(() => this.rewards.loadStatus()),
      )
      .subscribe({
        // 장소를 못 찾으면 QR 이 가리키는 곳이 없는 것과 같다
        next: () => {
          if (!this.space() && this.status() === 'entry') this.status.set('invalid');
        },
        error: () => this.status.set('failed'),
      });
  }
}
