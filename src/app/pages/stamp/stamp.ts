import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  StampResult,
  StampResultAction,
  StampResultStatus,
  STAMP_RESULT_STATUSES,
} from '../../shared/stamp-result/stamp-result';
import { PhotoCapture } from '../../shared/photo-capture/photo-capture';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import { SpaceService } from '../../core/space.service';
import { REWARD_TIERS } from '../../core/models';

/** 상태를 주소로 넘길 때 쓰는 쿼리 파라미터 이름 */
const STATUS_PARAM = 'status';

/**
 * 촬영기부터 띄우라는 표시.
 *
 * 장소 상세의 「사진으로 방문 인증하기」가 붙여 보낸다. 그 버튼을 누른 사람은 이미
 * 인증하겠다고 결정한 상태라, 안내 화면을 한 번 더 보여주면 같은 버튼을 두 번 누르게 된다.
 * QR 로 들어온 사람(파라미터 없음)은 여기가 어디인지부터 알아야 해서 안내 화면을 먼저 본다.
 */
const CAPTURE_PARAM = 'capture';

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
  protected readonly status = signal<StampResultStatus>('entry');
  /** 촬영기를 띄우는 중인지. 결과 화면과 자리를 바꿔 쓴다 */
  protected readonly capturing = signal(false);

  private readonly slug = signal('');

  /** 촬영기로 곧장 들어왔는지. 그만두기를 눌렀을 때 어디로 되돌릴지 가른다 */
  private enteredForCapture = false;

  protected readonly space = computed(() => this.spaces.findBySlug(this.slug()));
  protected readonly spaceName = computed(() => this.space()?.name ?? '');
  protected readonly spaceSummary = computed(() => this.space()?.summary ?? '');
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
    this.enteredForCapture = this.route.snapshot.queryParamMap.has(CAPTURE_PARAM);
    this.capturing.set(this.enteredForCapture);
    this.load();
  }

  protected onAction(action: StampResultAction): void {
    switch (action) {
      case 'claimStamp':
        // 적립은 사진 인증으로 한다. 촬영기를 띄우고 결과는 onPhotoConfirm 에서 정한다
        this.capturing.set(true);
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

  /**
   * 찍은 사진을 올린다.
   *
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
          this.capturing.set(false);
          this.status.set(this.rewards.eligibleTiers().length > 0 ? 'reward' : 'success');
        },
        error: () => {
          this.capturing.set(false);
          this.status.set('failed');
        },
      });
  }

  /**
   * 그만두기.
   *
   * 상세에서 곧장 촬영기로 들어왔으면 그 아래에 안내 화면이 없다. 촬영기만 닫으면
   * 본 적 없는 화면이 튀어나오므로 왔던 곳으로 되돌린다.
   */
  protected onCaptureCancel(): void {
    this.capturing.set(false);
    if (!this.enteredForCapture) return;

    if (this.slug()) {
      this.router.navigate(['/spaces', this.slug()]);
      return;
    }

    this.router.navigate(['/spaces']);
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
          if (this.space()) return;

          // 장소를 못 찾으면 찍을 대상이 없다. 촬영기를 닫고 안내로 되돌린다
          this.capturing.set(false);
          if (this.status() === 'entry') this.status.set('invalid');
        },
        error: () => {
          this.capturing.set(false);
          this.status.set('failed');
        },
      });
  }
}
