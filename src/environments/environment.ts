// API 베이스 주소와 개발용 스위치.
// 로컬 개발: apiBase '' (빈 문자열) → /api 요청을 dev 프록시가 백엔드(localhost:5001)로 전달.
// 배포 시: 백엔드의 절대주소로 교체.
export const environment = {
  apiBase: '',

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

  /**
   * true 면 네트워크 없이 로컬 fixture 로 화면을 그린다.
   *
   * 지금 true 인 이유 — 백엔드 `.env` 의 `SUPABASE_URL` 이 placeholder 라
   * 공간·사진·리워드 API 가 서버를 띄워도 동작하지 않는다. 인증 API 는 동작하지만
   * 실제 메일이 발송되고 재전송 60초 제한이 걸려 반복 검증이 느리다.
   *
   * 전환 조건 — Supabase 준비 완료 + 공간 6곳 식별자 확정 후 false.
   * 전환 시 재확인할 항목은 `docs/요구사항정의.md` 「전환 시 재검증할 것」 참고.
   */
  useMockApi: false,
};
