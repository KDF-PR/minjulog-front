// 배포용 설정 — `npm run build` 가 이 파일을 쓴다.
// `npm start` 는 environment.development.ts 로 갈아 끼운다 (angular.json fileReplacements).
// 로컬 확인용 값은 그쪽에서 고치고, 이 파일에는 배포본에 실릴 값만 둔다.
//
// apiBase 가 절대주소인 이유 — 배포본에는 dev 프록시가 없다. 빈 문자열이면 `/api` 요청이
// 프론트 자신에게 가고, Firebase Hosting 의 SPA rewrite 가 index.html 을 돌려줘
// JSON 파싱에서 깨진다.
export const environment = {
  // 프론트(minjulog.kr)와 등록 도메인이 같아야 세션 쿠키(SameSite=Lax)가 산다.
  // vercel.app 직접 주소로 되돌리면 교차 사이트가 되어 로그인이 유지되지 않는다
  apiBase: 'https://api.minjulog.kr',

  /**
   * Firebase 웹 설정. Firebase 프로젝트 `kdemo-stamp`.
   *
   * **secret 이 아니다.** `apiKey` 는 비밀번호가 아니라 프로젝트 식별자이고, 웹 앱에 번들로
   * 실려 브라우저에 그대로 노출되는 값이다. 실제 보호는 Firebase 콘솔의 보안 규칙과
   * API 키 제한이 한다 — 이 값을 숨겨서 얻는 보호는 없다.
   *
   * 백엔드(`kdemo-stamp-back`)의 Supabase 와 별개다. 어느 데이터를 어느 쪽에 둘지는
   * 아직 정하지 않았다.
   */
  firebase: {
    apiKey: 'AIzaSyDXZ0ivbchYNE5yw2UM3b4ozsUhHuv1TzE',
    authDomain: 'kdemo-stamp.firebaseapp.com',
    projectId: 'kdemo-stamp',
    storageBucket: 'kdemo-stamp.firebasestorage.app',
    messagingSenderId: '946324860801',
    appId: '1:946324860801:web:99902f30d564670b614280',
    measurementId: 'G-L1WSV61NT4',
  },

  // 배포본은 실제 API 를 쓴다. mock 으로 확인하는 건 npm start (development 구성) 쪽.
  useMockApi: false,
};
