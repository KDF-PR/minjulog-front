import { Component, computed, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, OTP_RESEND_WAIT_SECONDS, OTP_TTL_SECONDS } from '../auth/auth.service';

/**
 * 인증코드 입력 화면 — 6자리 코드 검증 후 대시보드로 이동.
 *
 * 타이머가 두 개다. 뜻이 달라 한 값으로 합칠 수 없다.
 *   ① 유효시간(`expiresIn`)   — 코드가 언제 죽는가. 화면에 `mm:ss` 로 보여준다
 *   ② 재전송 대기(`resendWait`) — 다시 받기 버튼을 언제 누를 수 있는가
 * 둘 다 백엔드가 강제하는 값이라 `auth.service.ts` 의 상수를 그대로 쓴다.
 *
 * 대기(60초)가 유효시간(300초)보다 짧아서, 코드가 만료된 시점에는 재전송이 항상 열려 있다.
 */
@Component({
  selector: 'app-verify',
  templateUrl: './verify.html',
  styleUrl: './verify.scss',
})
export class Verify implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);

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
        this.success.set('인증 성공! 대시보드로 이동합니다...');
        setTimeout(() => this.router.navigate(['/dashboard']), 800);
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

  /** 1초마다 두 타이머를 함께 줄인다. 유효시간이 다하면 멈춘다. */
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
