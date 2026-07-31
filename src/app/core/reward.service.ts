// reward.service.ts — 리워드 자격 조회와 코드 발급.
//
// **자격 판정은 항상 서버가 한다.** 화면의 진행률 계산은 표시용이고,
// 신청 가능 여부는 `eligibleTiers` 를 따른다. 어긋나면 서버가 맞다 (`app.py:540` 재계산).

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { EligibilityDto, RewardCodeDto } from './api.dto';
import { toRewardCode, toRewardStatus } from './api.mapper';
import { RewardCode, RewardStatus, RewardTier, REWARD_TIERS } from './models';
import { SpaceService } from './space.service';

const MOCK_LATENCY = 300;

@Injectable({ providedIn: 'root' })
export class RewardService {
  private http = inject(HttpClient);
  private spaces = inject(SpaceService);
  private base = environment.apiBase;

  private readonly status = signal<RewardStatus | null>(null);
  /** mock 전용 — 발급받은 코드를 기억해 두 번째 클릭에 같은 값을 돌려준다 */
  private readonly mockIssuedCodes = new Map<RewardTier, string>();

  readonly rewardStatus = this.status.asReadonly();
  readonly eligibleTiers = computed(() => this.status()?.eligibleTiers ?? []);
  readonly claimedTiers = computed(() => this.status()?.claimedTiers ?? []);

  canClaim(tier: RewardTier): boolean {
    return this.eligibleTiers().includes(tier);
  }

  hasClaimed(tier: RewardTier): boolean {
    return this.claimedTiers().includes(tier);
  }

  /** 자격 조회: `GET /api/rewards/eligibility` */
  loadStatus(): Observable<RewardStatus> {
    // mock 전환 지점 — 실제 방문 상태에서 자격을 계산해 화면 흐름을 맞춘다
    const source: Observable<EligibilityDto> = environment.useMockApi
      ? of(this.buildMockEligibility()).pipe(delay(MOCK_LATENCY))
      : this.http.get<EligibilityDto>(`${this.base}/api/rewards/eligibility`);

    return source.pipe(
      map(toRewardStatus),
      tap((status) => this.status.set(status)),
    );
  }

  /**
   * 코드 발급·조회: `POST /api/rewards/code`
   *
   * 같은 tier 로 여러 번 눌러도 코드는 바뀌지 않는다. 자격 미달이면 `403` 이 온다.
   * `formUrl` 이 `null` 로 올 수 있으므로 코드는 항상 화면에 함께 보여준다.
   */
  claimReward(tier: RewardTier): Observable<RewardCode> {
    // mock 전환 지점
    const source: Observable<RewardCodeDto> = environment.useMockApi
      ? of(this.buildMockCode(tier)).pipe(delay(MOCK_LATENCY))
      : this.http.post<RewardCodeDto>(`${this.base}/api/rewards/code`, { tier });

    return source.pipe(
      map(toRewardCode),
      tap((reward) => this.markClaimed(reward.tier)),
    );
  }

  private markClaimed(tier: RewardTier): void {
    this.status.update((current) =>
      current && !current.claimedTiers.includes(tier)
        ? { ...current, claimedTiers: [...current.claimedTiers, tier].sort() }
        : current,
    );
  }

  /** 방문 상태에서 자격을 계산한다 — 백엔드 `_reward_progress` 와 같은 규칙 */
  private buildMockEligibility(): EligibilityDto {
    const visitedCount = this.spaces.visitedCount();
    const hasRequired = this.spaces.hasVisitedRequired();
    return {
      visitedCount,
      hasRequired,
      eligibleTiers: REWARD_TIERS.filter((tier) => hasRequired && visitedCount >= tier),
      claimedTiers: [...this.mockIssuedCodes.keys()].sort(),
    };
  }

  private buildMockCode(tier: RewardTier): RewardCodeDto {
    const existing = this.mockIssuedCodes.get(tier);
    const code = existing ?? `MOCK${tier}${'AB7K9XQ2'.slice(0, 4)}`;
    this.mockIssuedCodes.set(tier, code);
    // 실제로는 구글폼 설정이 없으면 null 이 온다 — 그 경우도 화면에서 확인해야 한다
    return { tier, code, formUrl: null };
  }
}
