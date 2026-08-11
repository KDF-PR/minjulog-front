import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';

import { routes } from './app.routes';
import { credentialsInterceptor } from './auth/credentials.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor])),

    // Firebase 앱 초기화. 여기까지가 「연결」이고, Firestore·Auth 등 개별 기능은
    // 쓸 곳이 정해질 때 provideFirestore() 처럼 한 줄씩 더한다 — 미리 넣으면
    // 안 쓰는 SDK 가 번들에 실린다.
    provideFirebaseApp(() => initializeApp(environment.firebase)),
  ],
};
