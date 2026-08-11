import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AuthMethod } from '../../auth/auth.service';
import { RETURN_URL_PARAM } from '../../auth/auth.guard';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { WaveDivider } from '../../shared/layout/wave-divider/wave-divider';

/**
 * L1 · L3 — 로그인 화면. 휴대폰·이메일 중 하나를 골라 인증코드 요청. 두 경로는 흐름이 같아 한 화면.
 * `returnUrl` 은 여기서 쓰지 않고 verify 까지 그대로 전달 → 복귀는 인증 완료 후 발생.
 */
@Component({
  selector: 'app-login',
  imports: [PageHeader, WaveDivider],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** 시안 기본값 — 휴대폰 번호가 첫 번째 방식 */
  protected readonly method = signal<AuthMethod>('sms');
  /** 수집 동의. 체크 전에는 요청 불가 && 방식을 바꿔도 유지 */
  protected readonly consented = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** 인증 후 돌아갈 주소. 게이트를 거치지 않고 직접 진입했으면 null */
  private returnUrl: string | null = null;

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM);

    // 이미 로그인 상태면 이 화면을 보여줄 이유가 없음
    this.auth.fetchUser().subscribe((user) => {
      if (user) this.router.navigateByUrl(this.returnUrl ?? '/my-log');
    });
  }

  protected setMethod(method: AuthMethod): void {
    this.method.set(method);
    this.error.set(null);
  }

  protected sendOtp(identifier: string): void {
    const method = this.method();
    // 서비스와 같은 규칙으로 정규화 — verify 화면이 이 값을 그대로 재전송
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
        // 백엔드가 한국어 문장을 { error: "..." } 로 전달 — 표시용으로만 사용
        this.error.set(err?.error?.error ?? '오류가 발생했습니다.');
        this.loading.set(false);
      },
    });
  }
}
