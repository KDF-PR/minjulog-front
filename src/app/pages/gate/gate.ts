import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RETURN_URL_PARAM } from '../../auth/auth.guard';

/**
 * G1 — 로그인 게이트.
 *
 * 둘러보기는 로그인 없이 열어두고, **기록을 남기려는 순간에만** 신원을 묻는다.
 * 현장에 서 있는 사람에게 첫 화면부터 번호를 요구하면 그냥 나가버린다.
 *
 * 가드가 넘겨준 `returnUrl` 을 그대로 로그인까지 들고 간다. 이 화면은 판단하지 않고
 * 옮기기만 한다 — 복귀 위치를 정하는 곳이 여러 군데면 어긋나기 시작한다.
 */
@Component({
  selector: 'app-gate',
  templateUrl: './gate.html',
  styleUrl: './gate.scss',
})
export class Gate implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);

  /** 로그인 후 돌아갈 주소. 없으면 방문 현황으로 보낸다 */
  private returnUrl: string | null = null;

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.returnUrl = this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM);
  }

  /** 로그인으로 이동하면서 복귀 주소를 그대로 넘긴다 */
  protected startLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: this.returnUrl ? { [RETURN_URL_PARAM]: this.returnUrl } : {},
    });
  }

  /** 로그인하지 않고 둘러보기로 돌아간다 */
  protected goBack(): void {
    this.router.navigate(['/my-log']);
  }
}
