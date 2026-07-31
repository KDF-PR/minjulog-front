// API 베이스 주소와 개발용 스위치.
// 로컬 개발: apiBase '' (빈 문자열) → /api 요청을 dev 프록시가 백엔드(localhost:5001)로 전달.
// 배포 시: 백엔드의 절대주소로 교체.
export const environment = {
  apiBase: '',

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
  useMockApi: true,
};
