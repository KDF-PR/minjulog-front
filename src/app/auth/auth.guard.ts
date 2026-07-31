import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * 대시보드 등 로그인 필요한 화면을 보호하는 가드.
 * 백엔드에 현재 유저를 물어보고, 없으면 /login 으로 보냅니다.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.fetchUser().pipe(
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};

/**
 * verify 화면 가드: 코드 발송(pendingIdentifier 설정)을 거치지 않고
 * 직접 /verify 로 들어오면 /login 으로 돌려보냅니다.
 */
export const pendingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.pendingIdentifier ? true : router.createUrlTree(['/login']);
};
