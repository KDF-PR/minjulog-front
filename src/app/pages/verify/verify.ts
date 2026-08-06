import { Component, computed, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, OTP_RESEND_WAIT_SECONDS, OTP_TTL_SECONDS } from '../../auth/auth.service';
import { RETURN_URL_PARAM } from '../../auth/auth.guard';

/**
 * L2 — 인증코드 입력 화면. 6자리 검증 후 원래 자리로 복귀한다.
 *
 * 타이머 둘은 뜻이 달라 합칠 수 없다 — `expiresIn` 은 코드 만료, `resendWait` 는 재전송 대기.
 * 둘 다 백엔드가 강제해 `auth.service.ts` 상수를 그대로 쓴다. 대기(60초) < 유효(300초).
 */
@Component({
  selector: 'app-verify',
  templateUrl: './verify.html',
  styleUrl: './verify.scss',
})
export class Verify implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** 인증 후 돌아갈 주소. 게이트를 거치지 않았으면 null → 방문 현황으로 */
  private returnUrl: string | null = null;

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  readonly ready = signal(false);
  readonly identifier = this.auth.pendingIdentifier ?? '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  /** 코드 만료까지 남은 초. 0 이면 만료. */
  readonly expiresIn = signal(OTP_TTL_SECONDS);
  /** 재전송 가능까지 남은 초. 0 이면 누를 수 있다. */
  readonly resendWait = signal(OTP_RESEND_WAIT_SECONDS);

  readonly isExpired = computed(() => this.expiresIn() === 0);
  readonly canResend = computed(() => this.resendWait() === 0);
  /** `04:59` 형태. 만료 시 `00:00`. */
  readonly expiresLabel = computed(() => formatSeconds(this.expiresIn()));

  private ticker: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // DOM 을 먼저 그린 다음 프레임에서 모션을 시작한다 (첫 프레임에 붙으면 재생되지 않음)
    requestAnimationFrame(() => this.ready.set(true));
    this.returnUrl = this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM);
    // 이 화면에 들어온 시점이 곧 발송 직후다 — 두 타이머를 함께 시작한다
    this.startTicker();
  }

  verify(token: string): void {
    if (this.isExpired()) {
      this.error.set('인증코드가 만료되었습니다. 다시 받아주세요.');
      return;
    }
    const code = (token || '').trim();
    if (code.length !== 6) {
      this.error.set('6자리 인증코드를 입력해주세요.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.verifyOtp(this.identifier, code).subscribe({
      next: () => {
        this.loading.set(false);
        this.stopTicker();
        const target = this.returnUrl ?? '/my-log';
        this.success.set('인증되었습니다. 이동합니다...');
        setTimeout(() => this.router.navigateByUrl(target), 800);
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? '인증에 실패했습니다.');
        this.loading.set(false);
        // 시도 횟수를 넘기면 백엔드가 코드를 폐기한다 — 화면도 만료 상태로 맞춘다
        if (err?.status === 429) this.expiresIn.set(0);
      },
    });
  }

  resend(): void {
    if (!this.canResend() || !this.auth.pendingMethod) return;
    this.error.set(null);
    this.success.set(null);

    this.auth.sendOtp(this.auth.pendingMethod, this.identifier).subscribe({
      next: () => {
        this.success.set('인증코드가 재전송되었습니다.');
        // 새 코드가 발급됐으므로 두 타이머를 처음부터 다시 센다
        this.expiresIn.set(OTP_TTL_SECONDS);
        this.resendWait.set(OTP_RESEND_WAIT_SECONDS);
        this.startTicker();
      },
      error: (err) => this.error.set(err?.error?.error ?? '재전송에 실패했습니다.'),
    });
  }

  private startTicker(): void {
    this.stopTicker();
    this.ticker = setInterval(() => {
      this.resendWait.update((v) => Math.max(0, v - 1));
      this.expiresIn.update((v) => Math.max(0, v - 1));
      if (this.expiresIn() === 0) this.stopTicker();
    }, 1000);
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTicker();
  }
}

/** 초 → `mm:ss` */
function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
