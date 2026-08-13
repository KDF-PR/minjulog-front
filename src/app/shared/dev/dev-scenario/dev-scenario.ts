/**
 * 화면 상태를 실행 중에 바꾸는 개발 도구 — 로그인 전/후와 방문 수 시나리오.
 * mock 개발 빌드에서만 `App` 이 렌더링한다 — 프로덕션 번들에는 실리지 않는다.
 * 상태가 메모리 signal 이라 새로고침하면 초기값(로그인 상태 · `MOCK_SCENARIO`)으로 되돌아간다.
 */

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { PhotoService } from '../../../core/photo.service';
import { RewardService } from '../../../core/reward.service';
import { mockSignedIn } from '../../../core/mock/user.mock';
import {
  MOCK_VISIT_SCENARIOS,
  MockVisitScenario,
  activeMockScenario,
} from '../../../core/mock/visits.mock';

/** 버튼 라벨 — 디자인 02~06 화면 번호와 짝 */
const SCENARIO_LABELS: Record<MockVisitScenario, string> = {
  empty: '02 · 0곳',
  partial: '03 · 2곳',
  requiredMissing: '04 · 필수 빠짐',
  firstComplete: '05 · 3곳 완주',
  allComplete: '06 · 6곳 완주',
};

@Component({
  selector: 'app-dev-scenario',
  templateUrl: './dev-scenario.html',
  styleUrl: './dev-scenario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevScenario {
  private auth = inject(AuthService);
  private photos = inject(PhotoService);
  private rewards = inject(RewardService);

  protected readonly open = signal(false);
  protected readonly signedIn = mockSignedIn.asReadonly();
  protected readonly scenario = activeMockScenario.asReadonly();
  protected readonly scenarios = MOCK_VISIT_SCENARIOS;
  protected readonly labels = SCENARIO_LABELS;

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  /** 로그인 전 상태로 — 헤더 로그인 칩 · 게이트 진입 · 빈 방문 기록을 로그인 없이 확인 */
  protected signOut(): void {
    this.auth
      .logout()
      .pipe(switchMap(() => this.reloadVisitState()))
      .subscribe();
  }

  protected select(next: MockVisitScenario): void {
    activeMockScenario.set(next);
    // 시나리오는 로그인 후 상태 전제 — 로그인 전이었으면 복귀시킨다
    mockSignedIn.set(true);
    this.auth
      .fetchUser()
      .pipe(switchMap(() => this.reloadVisitState()))
      .subscribe();
  }

  /** 방문 목록을 먼저 갱신해야 리워드 자격이 새 방문 상태로 계산된다 */
  private reloadVisitState(): Observable<unknown> {
    return this.photos.loadVisits().pipe(switchMap(() => this.rewards.loadStatus()));
  }
}
