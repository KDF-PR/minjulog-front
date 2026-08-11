import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RETURN_URL_PARAM } from '../../auth/auth.guard';

/**
 * G1 — 로그인 게이트. 기록을 남기려는 순간에만 신원 확인.
 * 가드가 넘긴 `returnUrl` 은 판단 없이 로그인까지 전달 → 복귀 위치를 정하는 곳은 한 곳이어야 함.
 */
@Component({
  selector: 'app-gate',
  templateUrl: './gate.html',
  styleUrl: './gate.scss',
})
export class Gate implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 재생 */
  protected readonly ready = signal(false);

  /** 로그인 후 돌아갈 주소. 없으면 방문 현황으로 */
  private returnUrl: string | null = null;

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.returnUrl = this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM);
  }

  protected startLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: this.returnUrl ? { [RETURN_URL_PARAM]: this.returnUrl } : {},
    });
  }

  protected goBack(): void {
    this.router.navigate(['/my-log']);
  }
}
