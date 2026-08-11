import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  StampResult,
  StampResultAction,
  StampResultStatus,
  STAMP_RESULT_STATUSES,
} from './stamp-result/stamp-result';
import { PhotoCapture } from './photo-capture/photo-capture';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import { SpaceService } from '../../core/space.service';
import { REWARD_TIERS } from '../../core/models';

const STATUS_PARAM = 'status';

/**
 * 사진으로 방문을 인증하는 화면 (`/stamp/:slug`). `status` 가 비면 촬영기, 있으면 결과다.
 *
 * 결과 다섯 장은 `StampResult` 하나가 문구와 CTA 만 바꿔 그린다 —
 * 화면을 나누면 여백·타이포·버튼 폭을 다섯 곳에서 맞춰야 한다.
 * `status` 쿼리로 결과 화면을 직접 열 수 있다 (시안 확인용).
 */
@Component({
  selector: 'app-stamp',
  imports: [StampResult, PhotoCapture],
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

  /** 인증 결과. null 이면 아직 찍는 중이다 */
  protected readonly status = signal<StampResultStatus | null>(null);

  private readonly slug = signal('');

  protected readonly space = computed(() => this.spaces.findBySlug(this.slug()));
  protected readonly photoGuide = computed(() => this.space()?.photoGuide ?? '');
  protected readonly isUploading = this.photos.isUploading;
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
        // 결과를 지우면 촬영기가 다시 올라온다
        this.status.set(null);
        return;
    }
  }

  /**
   * 자격 판정은 서버 몫이라 업로드 성공 뒤 `RewardService` 를 다시 물어 상태를 정한다.
   * 방문 수로 화면에서 계산하면 서버 재계산과 어긋난다.
   */
  protected onPhotoConfirm(photo: Blob): void {
    const space = this.space();
    if (!space) return;

    this.photos
      .uploadPhoto(space.spaceId, photo)
      .pipe(switchMap(() => this.rewards.loadStatus()))
      .subscribe({
        next: () => {
          this.status.set(this.rewards.eligibleTiers().length > 0 ? 'reward' : 'success');
        },
        error: () => this.status.set('failed'),
      });
  }

  /** 그만두기 — 사진을 찍기로 한 자리로 되돌린다 */
  protected onCaptureCancel(): void {
    if (this.slug()) {
      this.router.navigate(['/spaces', this.slug()]);
      return;
    }

    this.router.navigate(['/spaces']);
  }

  /** 주소로 넘어온 결과 상태. 아는 값이 아니면 촬영기부터 연다 */
  private readStatus(): StampResultStatus | null {
    const raw = this.route.snapshot.queryParamMap.get(STATUS_PARAM);
    return STAMP_RESULT_STATUSES.find((value) => value === raw) ?? null;
  }

  private load(): void {
    this.spaces
      .loadSpaces()
      .pipe(
        switchMap(() => this.photos.loadVisits()),
        switchMap(() => this.rewards.loadStatus()),
      )
      .subscribe({
        next: () => {
          // 장소를 못 찾으면 찍을 대상이 없다. 촬영기를 닫고 안내로 바꾼다
          if (!this.space()) this.status.set('invalid');
        },
        error: () => this.status.set('failed'),
      });
  }
}
