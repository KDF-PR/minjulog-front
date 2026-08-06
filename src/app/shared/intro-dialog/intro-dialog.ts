import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * 헤더 `소개` 칩이 여는 안내 dialog.
 * 골격(`.dialog-dim` / `.dialog`)은 `templates/_dialog.scss` 가 전역 1회 방출한다.
 */
@Component({
  selector: 'app-intro-dialog',
  templateUrl: './intro-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroDialog {
  readonly open = input(false);
  readonly title = input('민주로그');

  /** 확정 문구 미수령 — 시안 자리 문구. 문구가 오면 이 기본값만 바뀐다 */
  readonly paragraphs = input<readonly string[]>([
    '민주로그 모바일 스탬프 투어는 민주·인권·평화 분야의 기념관을 소개하고 함께 걷기를 바라는 마음으로 만들었습니다.',
    '장소에 도착해 사진으로 인증하면 스탬프가 쌓이고, 모은 개수에 따라 선물이 하나씩 열립니다.',
  ]);

  readonly close = output<void>();
}
