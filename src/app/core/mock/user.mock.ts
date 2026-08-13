/**
 * 인증 API 4개의 가짜 응답. **백엔드 응답 모양을 그대로 흉내낸다.**
 *
 * 다른 mock 과 달리 목적이 "로그인 건너뛰기"다. 실제 인증은 메일이 발송되고 재전송
 * 60초 제한이 걸려, 로그인 이후 화면을 반복해서 확인하기 어렵다.
 *
 * **한계** — 세션 쿠키가 아니라 메모리 플래그라 새로고침하면 로그아웃된다.
 * 실제와 다른 유일한 지점이고, 쿠키 유지 여부는 `useMockApi = false` 로만 확인된다.
 */

import { signal } from '@angular/core';

// `import type` 이어야 한다 — auth.service 가 이 파일을 값으로 가져가므로
// 일반 import 면 런타임 순환 참조가 된다. 타입 import 는 컴파일 시 사라진다.
import type { AuthMethod, User } from '../../auth/auth.service';

/**
 * mock 로그인 상태 — 세션 쿠키 대신 이 signal 하나가 로그인 여부를 기억한다.
 *
 * **처음부터 로그인 상태로 둔다.** 그래야 `authGuard` 가 붙은 화면을 매번 로그인 없이
 * 열 수 있다. 로그인 전 상태는 DEV 패널의 「로그인 전」 버튼으로 전환해 확인한다.
 *
 * `AuthService` 밖에 두는 이유 — 비로그인일 때 실제 API 가 `401` 을 주듯
 * mock 데이터 서비스(`PhotoService`)도 이 값을 보고 빈 결과를 돌려줘야 해서다.
 * `useMockApi = false` 면 미사용.
 */
export const mockSignedIn = signal(true);

/** 로그인 성공 시 돌려줄 가짜 유저. id 는 고정값이라 실행할 때마다 흔들리지 않는다 */
export const USER_MOCK: User = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'mock@minjuroad.test',
  phone: null,
  method: 'email',
};

/** 입력한 값으로 유저를 만든다 — 화면에 방금 넣은 이메일/번호가 그대로 보이게 */
export function buildUserMock(method: AuthMethod, identifier: string): User {
  return {
    ...USER_MOCK,
    method,
    email: method === 'email' ? identifier : null,
    phone: method === 'sms' ? identifier : null,
  };
}

/**
 * mock 모드에서 통과시킬 인증코드.
 *
 * 아무 6자리나 받으면 "잘못된 코드" 화면을 볼 수 없다. 한 값만 정답으로 두고
 * 나머지는 실패시켜 오류 상태도 함께 확인한다.
 */
export const MOCK_OTP_CODE = '000000';
