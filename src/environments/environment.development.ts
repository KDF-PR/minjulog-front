// 개발용 설정 — `npm start` 가 이 파일을 쓴다 (angular.json fileReplacements).
// 배포 빌드(`npm run build`)는 environment.ts 를 쓰므로 여기 값은 배포본에 실리지 않는다.
export const environment = {
  // 빈 문자열 → `/api` 요청을 dev 프록시(proxy.conf.json)가 백엔드로 전달.
  // mock 모드에서는 네트워크가 없어 이 값이 쓰이지 않는다.
  apiBase: '',

  // Firebase 웹 설정. environment.ts 와 같은 값 — 프로젝트가 하나뿐이다.
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
   * true — 네트워크 없이 로컬 fixture 로 화면을 그린다. DEV 패널도 이 값이 켠다.
   *
   * 로컬에서 실제 백엔드를 붙여 볼 때만 false 로 바꾼다. 그 경우 요청은
   * proxy.conf.json 의 target 으로 간다 — 로컬 백엔드(localhost:5001)인지 확인할 것.
   */
  useMockApi: true,
};
