import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * 로그인 후 돌아갈 주소를 실어 나르는 쿼리 파라미터 이름.
 *
 * 서비스 메모리가 아니라 **URL 에 담는다.** 게이트에서 로그인까지 화면이 두 번 바뀌는데,
 * 그 사이 새로고침하면 메모리 값은 사라져 엉뚱한 데로 보내게 된다.
 */
export const RETURN_URL_PARAM = 'returnUrl';

/**
 * 로그인이 필요한 화면을 보호하는 가드.
 *
 * **막기만 하고 끝내지 않는다.** 사진을 찍으려던 사람이 로그인 후 엉뚱한 화면에
 * 도착하면 하던 일을 잃는다. 원래 가려던 주소를 `returnUrl` 로 넘겨 게이트(G1)로 보낸다.
 *
 * 둘러보기(메인 · 방문할 곳 · 장소 상세)에는 붙이지 않는다 —
 * 요구사항상 로그인 없이 볼 수 있어야 한다. `docs/요구사항정의.md` 5장.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.fetchUser().pipe(
    map((user) =>
      user
        ? true
        : router.createUrlTree(['/gate'], {
            queryParams: { [RETURN_URL_PARAM]: state.url },
          }),
    ),
  );
};

/**
 * verify 화면 가드: 코드 발송(pendingIdentifier 설정)을 거치지 않고
 * 직접 /verify 로 들어오면 /login 으로 돌려보낸다.
 *
 * 이때도 `returnUrl` 을 잃지 않게 그대로 넘긴다.
 */
export const pendingGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.pendingIdentifier) return true;

  const returnUrl = route.queryParamMap.get(RETURN_URL_PARAM);
  return router.createUrlTree(['/login'], {
    queryParams: returnUrl ? { [RETURN_URL_PARAM]: returnUrl } : {},
  });
};
