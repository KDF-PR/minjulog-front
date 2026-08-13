/**
 * 방문 완료 후 내 사진 카드. 「내 사진 보기」로 내 사진 시트를 연다.
 * space-detail 의 SCSS 가 스타일 예산(8kB)에 닿아 카드를 분리했다 — 합치면 예산 초과.
 */

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Visit } from '../../../core/models';

@Component({
  selector: 'app-visit-record',
  imports: [],
  templateUrl: './visit-record.html',
  styleUrl: './visit-record.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitRecord {
  readonly visit = input.required<Visit>();

  /** 「내 사진 보기」 — 시트 열기는 부모 담당 */
  readonly view = output<void>();
}
