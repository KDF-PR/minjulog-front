/**
 * 방문 수 시나리오를 실행 중에 바꾸는 개발 도구.
 * mock 개발 빌드에서만 `App` 이 렌더링한다 — 프로덕션 번들에는 실리지 않는다.
 * 상태가 메모리 signal 이라 새로고침하면 `MOCK_SCENARIO` 초기값으로 되돌아간다.
 */

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { PhotoService } from '../../core/photo.service';
import { RewardService } from '../../core/reward.service';
import {
  MOCK_VISIT_SCENARIOS,
  MockVisitScenario,
  activeMockScenario,
} from '../../core/mock/visits.mock';

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
  private photos = inject(PhotoService);
  private rewards = inject(RewardService);

  protected readonly open = signal(false);
  protected readonly scenario = activeMockScenario.asReadonly();
  protected readonly scenarios = MOCK_VISIT_SCENARIOS;
  protected readonly labels = SCENARIO_LABELS;

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected select(next: MockVisitScenario): void {
    activeMockScenario.set(next);
    // 방문 목록을 먼저 갱신해야 리워드 자격이 새 방문 상태로 계산된다
    this.photos
      .loadVisits()
      .pipe(switchMap(() => this.rewards.loadStatus()))
      .subscribe();
  }
}
