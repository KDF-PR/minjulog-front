import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MOCK_OTP_CODE, USER_MOCK, buildUserMock } from '../core/mock/user.mock';

export type AuthMethod = 'email' | 'sms';

/** mock 응답 지연(ms). 로딩 상태가 화면에서 보이도록 실제와 비슷한 시간을 준다 */
const MOCK_LATENCY = 300;

// ── 백엔드 인증코드 정책 ──────────────────────────────────────────────
// 백엔드가 강제하는 값이다. 한쪽만 바꾸면 화면과 서버 판정이 어긋난다.

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

/**
 * 백엔드 인증 API(4개)를 감싼 서비스.
 *
 * `environment.useMockApi` 가 true 면 네트워크 없이 로컬에서 로그인을 흉내낸다.
 * 실제 인증은 메일이 발송되고 재전송 60초 제한이 걸려, 로그인 이후 화면을
 * 반복 확인하기 어렵기 때문이다. 통과 코드와 가짜 유저는 `core/mock/user.mock.ts`.
 *
 * **mock 모드의 한계** — 세션 쿠키가 아니라 메모리 플래그라 새로고침하면 로그아웃된다.
 * 쿠키가 실제로 유지되는지는 `useMockApi = false` 로 바꿔야 확인된다.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  // 로그인한 유저 (없으면 null)
  readonly currentUser = signal<User | null>(null);

  // verify 화면으로 넘길 때 들고 가는 임시 상태
  pendingIdentifier: string | null = null;
  pendingMethod: AuthMethod | null = null;

  /** mock 전용 — 세션 쿠키 대신 로그인 여부를 기억한다 */
  private mockSignedIn = false;

  /**
   * 식별자 정규화 — 발송과 검증이 **같은 문자열**을 보내게 만든다.
   *
   * 백엔드는 이 값을 인증코드의 키로 쓰는데, 두 경로가 다르게 다듬는다.
   * `send-otp` 는 `.strip().lower()`(`app.py:223`), `verify-otp` 는 `.strip()` 만이라
   * (`app.py:274`) 대문자를 섞으면 검증이 실패한다. 프론트에서 미리 맞춰 우회한다.
   *
   * 전화번호는 양쪽 다 숫자만 남기므로 표시용 하이픈만 걷어낸다.
   */
  normalizeIdentifier(method: AuthMethod, raw: string): string {
    const trimmed = (raw ?? '').trim();
    return method === 'email' ? trimmed.toLowerCase() : trimmed.replace(/\D/g, '');
  }

  /** 인증코드 발송: POST /api/auth/send-otp */
  sendOtp(method: AuthMethod, identifier: string): Observable<{ message: string }> {
    const normalized = this.normalizeIdentifier(method, identifier);

    // mock 전환 지점 — 실제 메일을 보내지 않는다
    if (environment.useMockApi) {
      return of({ message: `[mock] 인증코드는 ${MOCK_OTP_CODE} 입니다.` }).pipe(
        delay(MOCK_LATENCY),
      );
    }

    const body = method === 'email' ? { method, email: normalized } : { method, phone: normalized };
    return this.http.post<{ message: string }>(`${this.base}/api/auth/send-otp`, body);
  }

  /** 인증코드 검증: POST /api/auth/verify-otp (성공 시 백엔드가 세션 쿠키 발급) */
  verifyOtp(identifier: string, token: string): Observable<{ message: string; user: User }> {
    // 발송 때와 같은 규칙으로 다듬는다. method 를 모르면 `@` 유무로 판단한다.
    const method: AuthMethod = this.pendingMethod ?? (identifier.includes('@') ? 'email' : 'sms');
    const normalized = this.normalizeIdentifier(method, identifier);

    // mock 전환 지점 — 정해진 코드만 통과시켜 오류 화면도 확인할 수 있게 한다
    if (environment.useMockApi) {
      if ((token ?? '').trim() !== MOCK_OTP_CODE) {
        // 백엔드의 코드 불일치와 같은 모양으로 실패시킨다 (상태코드 401 + 한국어 문장)
        return throwError(() => ({
          status: 401,
          error: { error: '인증코드가 일치하지 않습니다.' },
        })).pipe(delay(MOCK_LATENCY));
      }
      const user = buildUserMock(method, normalized);
      return of({ message: '[mock] 인증되었습니다.', user }).pipe(
        delay(MOCK_LATENCY),
        tap((res) => {
          this.mockSignedIn = true;
          this.currentUser.set(res.user);
        }),
      );
    }

    return this.http
      .post<{ message: string; user: User }>(`${this.base}/api/auth/verify-otp`, {
        identifier: normalized,
        token: (token ?? '').trim(),
      })
      .pipe(tap((res) => this.currentUser.set(res.user)));
  }

  /** 현재 유저 조회: GET /api/auth/user (미로그인이면 401 → null 로 변환) */
  fetchUser(): Observable<User | null> {
    // mock 전환 지점 — 쿠키 대신 메모리 플래그를 본다
    if (environment.useMockApi) {
      const user = this.mockSignedIn ? (this.currentUser() ?? USER_MOCK) : null;
      this.currentUser.set(user);
      return of(user).pipe(delay(MOCK_LATENCY));
    }

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
    // mock 전환 지점 — 서버 호출 없이 로컬 상태만 지운다
    const source: Observable<unknown> = environment.useMockApi
      ? of({ message: '[mock] 로그아웃되었습니다.' }).pipe(delay(MOCK_LATENCY))
      : this.http.post(`${this.base}/api/auth/logout`, {});

    return source.pipe(
      tap(() => {
        this.mockSignedIn = false;
        this.currentUser.set(null);
        this.pendingIdentifier = null;
        this.pendingMethod = null;
      }),
    );
  }
}
