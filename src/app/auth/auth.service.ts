import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type AuthMethod = 'email' | 'sms';

// ── 백엔드 인증코드 정책 ──────────────────────────────────────────────
// 화면 타이머는 아래 값을 따른다. 백엔드가 실제로 강제하는 값이므로
// 임의로 바꾸면 화면과 서버 판정이 어긋난다. 변경 시 양쪽을 함께 고친다.

/** 인증코드 유효 시간(초). `../kdemo-stamp-back/app.py:102` `OTP_TTL` */
export const OTP_TTL_SECONDS = 300;

/** 재전송 대기 시간(초). 이 안에 재요청하면 백엔드가 `429`. `app.py:104` `OTP_RESEND_WAIT` */
export const OTP_RESEND_WAIT_SECONDS = 60;

/** 최대 검증 시도 횟수. 초과하면 코드가 폐기되고 재요청해야 한다. `app.py:103` `OTP_MAX_ATTEMPTS` */
export const OTP_MAX_ATTEMPTS = 5;

export interface User {
  id: string | null;
  email: string | null;
  phone: string | null;
  method: AuthMethod;
}

/** 백엔드 인증 API(4개)를 감싼 서비스. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  // 로그인한 유저 (없으면 null)
  readonly currentUser = signal<User | null>(null);

  // verify 화면으로 넘길 때 들고 가는 임시 상태
  pendingIdentifier: string | null = null;
  pendingMethod: AuthMethod | null = null;

  /**
   * 식별자 정규화 — 발송과 검증이 **반드시 같은 문자열**을 보내게 만든다.
   *
   * 백엔드는 이 값을 그대로 키로 써서 인증코드를 저장·조회한다. 한 글자만 달라도
   * `400 인증코드를 먼저 요청해주세요` 가 난다. 그런데 백엔드의 두 경로가 서로 다르게 다듬는다.
   *
   * - `send-otp` 이메일: `.strip().lower()` (`app.py:223`)
   * - `verify-otp` 이메일: `.strip()` 만 — **소문자 변환이 빠져 있다** (`app.py:274`)
   *
   * 그래서 `Test@Gmail.com` 처럼 대문자를 섞어 입력하면 검증이 실패한다.
   * 프론트에서 미리 소문자로 맞춰 보내 우회한다. 백엔드가 고쳐져도 이 처리는 무해하다.
   *
   * 전화번호는 양쪽 모두 숫자만 남기므로(`app.py:124`, `app.py:277`) 표시용 하이픈만 걷어낸다.
   */
  normalizeIdentifier(method: AuthMethod, raw: string): string {
    const trimmed = (raw ?? '').trim();
    return method === 'email' ? trimmed.toLowerCase() : trimmed.replace(/\D/g, '');
  }

  /** 인증코드 발송: POST /api/auth/send-otp */
  sendOtp(method: AuthMethod, identifier: string): Observable<{ message: string }> {
    const normalized = this.normalizeIdentifier(method, identifier);
    const body =
      method === 'email'
        ? { method, email: normalized }
        : { method, phone: normalized };
    return this.http.post<{ message: string }>(`${this.base}/api/auth/send-otp`, body);
  }

  /** 인증코드 검증: POST /api/auth/verify-otp (성공 시 백엔드가 세션 쿠키 발급) */
  verifyOtp(identifier: string, token: string): Observable<{ message: string; user: User }> {
    // 발송 때와 같은 규칙으로 다듬는다. method 를 모르면 `@` 유무로 판단한다.
    const method: AuthMethod = this.pendingMethod ?? (identifier.includes('@') ? 'email' : 'sms');
    const normalized = this.normalizeIdentifier(method, identifier);
    return this.http
      .post<{ message: string; user: User }>(`${this.base}/api/auth/verify-otp`, {
        identifier: normalized,
        token: (token ?? '').trim(),
      })
      .pipe(tap((res) => this.currentUser.set(res.user)));
  }

  /** 현재 유저 조회: GET /api/auth/user (미로그인이면 401 → null 로 변환) */
  fetchUser(): Observable<User | null> {
    return this.http.get<{ user: User }>(`${this.base}/api/auth/user`).pipe(
      map((res) => {
        this.currentUser.set(res.user);
        return res.user;
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }

  /** 로그아웃: POST /api/auth/logout */
  logout(): Observable<unknown> {
    return this.http.post(`${this.base}/api/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.pendingIdentifier = null;
        this.pendingMethod = null;
      }),
    );
  }
}
