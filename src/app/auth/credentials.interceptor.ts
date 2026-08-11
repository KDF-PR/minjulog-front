import { HttpInterceptorFn } from '@angular/common/http';

/**
 * 모든 HTTP 요청에 `withCredentials: true` 를 붙여 세션 쿠키가 함께 전송되게 한다.
 *
 * 로컬은 dev 프록시로 같은 출처라 없어도 동작하지만,
 * 배포(프론트·백 도메인 분리) 시에는 이게 없으면 로그인 상태가 유지되지 않는다.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
