import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AuthMethod } from '../../auth/auth.service';
import { RETURN_URL_PARAM } from '../../auth/auth.guard';

/**
 * L1 · L3 — 로그인 화면. 휴대폰/이메일을 골라 인증코드를 받는다. 두 경로는 흐름이 같아 한 화면이다.
 * `returnUrl` 은 여기서 쓰지 않고 verify 까지 그대로 넘긴다 — 복귀는 인증이 끝난 뒤에 일어난다.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  readonly ready = signal(false);
  readonly method = signal<AuthMethod>('email');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** 인증 후 돌아갈 주소. 게이트를 거치지 않고 직접 왔으면 null */
  private returnUrl: string | null = null;

  ngOnInit(): void {
    // 첫 프레임에 .is-ready 가 붙으면 모션이 재생되지 않는다
    requestAnimationFrame(() => this.ready.set(true));

    this.returnUrl = this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM);

    // 이미 로그인돼 있으면 로그인 화면을 보여줄 이유가 없다
    this.auth.fetchUser().subscribe((user) => {
      if (user) this.router.navigateByUrl(this.returnUrl ?? '/my-log');
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
        this.router.navigate(['/verify'], {
          queryParams: this.returnUrl ? { [RETURN_URL_PARAM]: this.returnUrl } : {},
        });
      },
      error: (err) => {
        // 백엔드가 한국어 메시지를 { error: "..." } 로 줌
        this.error.set(err?.error?.error ?? '오류가 발생했습니다.');
        this.loading.set(false);
      },
    });
  }
}
