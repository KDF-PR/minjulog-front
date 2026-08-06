import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/** 로그인 후 화면 — 현재 유저 정보 표시 및 로그아웃. */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  readonly ready = signal(false);

  // 가드(authGuard)가 진입 전 fetchUser 를 호출해 currentUser 를 채워둠
  readonly user = this.auth.currentUser;
  readonly apiResult = signal<string | null>(null);

  ngOnInit(): void {
    // 첫 프레임에 .is-ready 가 붙으면 모션이 재생되지 않는다
    requestAnimationFrame(() => this.ready.set(true));
  }

  testApi(): void {
    this.auth.fetchUser().subscribe((u) => {
      this.apiResult.set(JSON.stringify({ user: u }, null, 2));
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
