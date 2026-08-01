import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * 헤더 `소개` 칩이 여는 안내 dialog.
 *
 * 본문은 아직 확정 문구를 받지 못했다. 시안의 자리 문구를 그대로 두고 문단 배열로만
 * 받는다 — 문구가 오면 `paragraphs` 기본값 한 곳만 바뀐다.
 *
 * 골격(`.dialog-dim` / `.dialog`)은 `templates/_dialog.scss` 가 전역 1회 방출한다.
 */
@Component({
  selector: 'app-intro-dialog',
  templateUrl: './intro-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroDialog {
  readonly open = input(false);
  readonly title = input('민주로드');

  /** 확정 문구 미수령 — 시안 자리 문구 */
  readonly paragraphs = input<readonly string[]>([
    '민주로드 모바일 스탬프 투어는 민주·인권·평화 분야의 기념관을 소개하고 함께 걷기를 바라는 마음으로 만들었습니다.',
    '기관을 방문해 QR을 찍으면 스탬프가 쌓이고, 모은 개수에 따라 선물이 하나씩 열립니다.',
  ]);

  readonly close = output<void>();
}
