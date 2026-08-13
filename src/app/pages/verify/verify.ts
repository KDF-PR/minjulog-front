import {
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthService,
  AuthMethod,
  OTP_RESEND_WAIT_SECONDS,
  OTP_TTL_SECONDS,
} from '../../auth/auth.service';
import { RETURN_URL_PARAM } from '../../auth/auth.guard';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { WaveDivider } from '../../shared/layout/wave-divider/wave-divider';

/**
 * 화면 상태. 오류를 boolean 여러 개로 나누지 않고 union 하나로 분기.
 * 분기 근거는 상태코드와 로컬 타이머 — 서버의 한국어 문장으로 분기 금지 (backend-api.md).
 *
 *   input     코드 입력 중 (정상)
 *   mismatch  코드 불일치 — 401
 *   expired   코드 만료 — 로컬 타이머(OTP_TTL_SECONDS) 소진
 *   exceeded  시도 초과 — 429, 백엔드가 코드 폐기
 *
 * 성공은 상태가 아니다 — 완료 화면 없이 즉시 원래 자리로 이동한다.
 */
type VerifyStatus = 'input' | 'mismatch' | 'expired' | 'exceeded';

const CODE_LENGTH = 6;

/**
 * L2 — 인증코드 입력 화면. 6자리 검증 성공 시 완료 화면 없이 바로 복귀.
 *
 * 실제 input 은 하나 — SMS 자동입력(`autocomplete="one-time-code"`)과 붙여넣기는
 * 한 input 에만 온전히 들어옴. 시각 6칸은 값을 한 자리씩 나눠 그리는 표시 전용.
 *
 * 타이머 둘은 뜻이 달라 통합 불가 — `expiresIn` 은 코드 만료, `resendWait` 는 재전송 대기.
 * 둘 다 백엔드 강제값이라 `auth.service.ts` 상수 그대로 사용. 대기(60초) < 유효(300초).
 */
@Component({
  selector: 'app-verify',
  imports: [PageHeader, WaveDivider],
  templateUrl: './verify.html',
  styleUrl: './verify.scss',
})
export class Verify implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private readonly codeInput = viewChild<ElementRef<HTMLInputElement>>('codeRef');

  private readonly identifier = this.auth.pendingIdentifier ?? '';
  /** 발송 방식. 새로고침으로 유실 시 식별자 모양으로 추정 — auth.service 와 같은 규칙 */
  private readonly method: AuthMethod =
    this.auth.pendingMethod ?? (this.identifier.includes('@') ? 'email' : 'sms');

  protected readonly status = signal<VerifyStatus>('input');
  protected readonly code = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** 코드 만료까지 남은 초. 0 이면 만료 */
  private readonly expiresIn = signal(OTP_TTL_SECONDS);
  /** 재전송 가능까지 남은 초. 0 이면 클릭 가능 */
  protected readonly resendWait = signal(OTP_RESEND_WAIT_SECONDS);

  protected readonly canResend = computed(() => this.resendWait() === 0);
  /** `04:59` 형태. 만료 시 `00:00` */
  protected readonly expiresLabel = computed(() => formatSeconds(this.expiresIn()));
  /** 표시용 6칸. 실제 input 값을 한 자리씩 분할 */
  protected readonly codeChars = computed(() =>
    Array.from({ length: CODE_LENGTH }, (_, i) => this.code()[i] ?? ''),
  );
  /** 표시용 커서가 놓일 칸. 여섯 자리가 차면 -1 */
  protected readonly caretIndex = computed(() =>
    this.code().length < CODE_LENGTH ? this.code().length : -1,
  );

  /** "{식별자}로 보낸 6자리 코드를 입력해 주세요" — 이메일은 조사가 '으로', 숫자는 '로' */
  protected readonly sentSubtitle =
    this.method === 'email'
      ? `${this.identifier}으로 보낸 6자리 코드를 입력해 주세요`
      : `${formatPhoneNumber(this.identifier)}로 보낸 6자리 코드를 입력해 주세요`;

  protected readonly notReceivedHint =
    this.method === 'email'
      ? '코드가 오지 않으면 스팸함을 확인해 주세요'
      : '문자가 오지 않으면 번호를 확인해 주세요';

  /** 인증 후 돌아갈 주소. 게이트를 거치지 않았으면 null → 방문 현황으로 */
  private returnUrl: string | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM);
    // 이 화면 진입 시점이 곧 발송 직후 → 두 타이머를 함께 시작
    this.startTicker();
  }

  ngOnDestroy(): void {
    this.stopTicker();
  }

  /** 표시 6칸 아래 깔린 실제 input. 숫자만 남기고 여섯 자리에서 절단 */
  protected onCodeInput(inputElement: HTMLInputElement): void {
    const digits = inputElement.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    inputElement.value = digits;
    this.code.set(digits);
    // 틀린 코드를 고치기 시작하면 오류 표시 해제
    if (this.status() === 'mismatch') {
      this.status.set('input');
      this.error.set(null);
    }
  }

  protected verify(): void {
    if (this.loading() || this.code().length !== CODE_LENGTH) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.verifyOtp(this.identifier, this.code()).subscribe({
      next: () => {
        this.loading.set(false);
        this.stopTicker();
        this.redirectAfterLogin();
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 429) {
          // 시도 횟수 초과 시 백엔드가 코드 폐기 → 재전송만 남음
          this.status.set('exceeded');
          this.code.set('');
          this.expiresIn.set(0);
          this.error.set(err?.error?.error ?? '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.');
        } else {
          this.status.set('mismatch');
          this.error.set(err?.error?.error ?? '인증에 실패했습니다.');
        }
      },
    });
  }

  /** 불일치 상태의 주 버튼 — 입력을 비우고 처음부터 재입력 */
  protected retype(): void {
    this.code.set('');
    this.error.set(null);
    this.status.set('input');
    this.codeInput()?.nativeElement.focus();
  }

  /** 만료·초과 상태의 주 버튼. 재전송 대기 60초는 백엔드 제한이라 그대로 준수 */
  protected resend(): void {
    if (!this.canResend()) return;

    this.auth.sendOtp(this.method, this.identifier).subscribe({
      next: () => {
        // 새 코드가 발급됐으므로 입력과 두 타이머를 초기화
        this.code.set('');
        this.error.set(null);
        this.status.set('input');
        this.expiresIn.set(OTP_TTL_SECONDS);
        this.resendWait.set(OTP_RESEND_WAIT_SECONDS);
        this.startTicker();
      },
      error: (err) => this.error.set(err?.error?.error ?? '재전송에 실패했습니다.'),
    });
  }

  /**
   * 인증 성공 — 게이트가 넘긴 자리로 즉시 복귀, 없으면 방문 현황.
   *
   * 인증 화면 주소는 버린다 — 헤더의 로그인 링크가 현재 화면(`/verify` 등)을
   * `returnUrl` 로 실어 보내는 경우가 있어, 그대로 따르면 로그인 직후
   * 인증코드 입력 화면으로 돌아가는 순환이 생긴다.
   */
  private redirectAfterLogin(): void {
    const target = this.returnUrl;
    const isAuthScreen = ['/login', '/verify', '/gate'].some((path) => target?.startsWith(path));
    this.router.navigateByUrl(target && !isAuthScreen ? target : '/my-log');
  }

  private startTicker(): void {
    this.stopTicker();
    this.ticker = setInterval(() => {
      this.resendWait.update((v) => Math.max(0, v - 1));

      // 만료 카운트는 입력 중에만 유효 — 초과 상태는 이미 0 으로 고정됨
      if (this.status() === 'input' || this.status() === 'mismatch') {
        this.expiresIn.update((v) => Math.max(0, v - 1));
        if (this.expiresIn() === 0) this.expire();
      }

      // 두 카운트가 모두 끝나면 더 셀 것이 없음
      if (this.expiresIn() === 0 && this.resendWait() === 0) this.stopTicker();
    }, 1000);
  }

  /** 로컬 타이머 소진. 서버 응답 없이 발생하므로 문구도 로컬 보관 */
  private expire(): void {
    this.status.set('expired');
    this.code.set('');
    this.error.set('인증코드가 만료되었습니다. 다시 요청해주세요.');
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }
}

/** 초 → `mm:ss` */
function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** 숫자만 남은 휴대폰 번호를 010-1234-5678 형태로 변환. 자리수가 어긋나면 원문 그대로 */
function formatPhoneNumber(digits: string): string {
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}
