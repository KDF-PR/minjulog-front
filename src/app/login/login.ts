import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthMethod } from '../auth/auth.service';

/** 로그인 화면 — 이메일/SMS 선택 후 인증코드 발송. */
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  readonly ready = signal(false);
  readonly method = signal<AuthMethod>('email');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // DOM 을 먼저 그린 다음 프레임에서 모션을 시작한다 (첫 프레임에 붙으면 재생되지 않음)
    requestAnimationFrame(() => this.ready.set(true));

    // 이미 로그인돼 있으면 바로 대시보드로
    this.auth.fetchUser().subscribe((user) => {
      if (user) this.router.navigate(['/dashboard']);
    });
  }

  setMethod(m: AuthMethod): void {
    this.method.set(m);
    this.error.set(null);
  }

  sendOtp(identifier: string): void {
    const method = this.method();
    // 서비스와 같은 규칙으로 다듬어 둔다 — verify 화면이 이 값을 그대로 다시 보낸다
    const id = this.auth.normalizeIdentifier(method, identifier);
    if (!id) {
      this.error.set(method === 'email' ? '이메일을 입력해주세요.' : '휴대폰 번호를 입력해주세요.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.sendOtp(method, id).subscribe({
      next: () => {
        this.auth.pendingIdentifier = id;
        this.auth.pendingMethod = method;
        this.router.navigate(['/verify']);
      },
      error: (err) => {
        // 백엔드가 한국어 메시지를 { error: "..." } 로 줌
        this.error.set(err?.error?.error ?? '오류가 발생했습니다.');
        this.loading.set(false);
      },
    });
  }
}
