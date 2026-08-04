import { Routes } from '@angular/router';
import { authGuard, pendingGuard } from './auth/auth.guard';

/**
 * 라우팅. 모든 화면을 `loadComponent` 로 지연 로드한다.
 *
 * **둘러보기에는 가드를 붙이지 않는다.** 현장에 선 사람에게 첫 화면부터
 * 번호를 요구하면 그냥 나가버린다. 기록을 남기는 순간에만 막는다.
 * 막힌 사람은 `/gate` 로 가고 원래 주소는 `returnUrl` 로 따라간다.
 * → `docs/요구사항정의.md` 5장 「로그인 시점」
 */
export const routes: Routes = [
  // ── 둘러보기 · 로그인 불필요 ────────────────────────────────
  {
    path: 'main',
    loadComponent: () => import('./pages/main/main').then((m) => m.Main),
  },
  {
    path: 'my-log',
    loadComponent: () => import('./pages/my-log/my-log').then((m) => m.MyLog),
  },
  {
    path: 'spaces',
    loadComponent: () => import('./pages/spaces/spaces').then((m) => m.Spaces),
  },
  {
    path: 'spaces/:slug',
    loadComponent: () => import('./pages/space-detail/space-detail').then((m) => m.SpaceDetail),
  },
  // 사진 인증. 장소 상세의 인증 버튼이 보내고, 결과 5장은 `status` 쿼리로 갈린다
  {
    path: 'stamp/:slug',
    loadComponent: () => import('./pages/stamp/stamp').then((m) => m.Stamp),
  },
  // 어떤 선물이 걸려 있는지는 로그인 전에도 보인다.
  // 막는 것은 「리워드 받기」를 누르는 순간이고, 그 판단은 화면 안에서 한다
  {
    path: 'reward',
    loadComponent: () => import('./pages/reward/reward').then((m) => m.Reward),
  },

  // ── 인증 흐름 ───────────────────────────────────────────────
  {
    path: 'gate',
    loadComponent: () => import('./pages/gate/gate').then((m) => m.Gate),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'verify',
    canActivate: [pendingGuard],
    loadComponent: () => import('./pages/verify/verify').then((m) => m.Verify),
  },

  // ── 개발 확인용 · 요구사항 36개에 없다. main 이 채워지면 제거 ──
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },

  { path: '', pathMatch: 'full', redirectTo: 'main' },
  { path: '**', redirectTo: 'main' },
];
