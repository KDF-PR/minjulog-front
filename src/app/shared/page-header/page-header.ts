import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * 탭 화면 세 곳과 장소 상세가 공유하는 상단 헤더.
 * `소개` dialog 는 화면이 연다 — 헤더가 직접 들면 화면마다 인스턴스가 생긴다.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  /** 워드마크 자리 문구. 자산 export 를 받으면 이미지로 바뀐다 */
  readonly title = input('민주로그');

  /** `소개` 칩을 눌렀다 */
  readonly introSelect = output<void>();
}
