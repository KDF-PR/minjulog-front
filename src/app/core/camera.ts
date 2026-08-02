import { Signal, signal } from '@angular/core';
import { drawScaled, toJpeg } from './image';

/**
 * 브라우저 카메라 제어 헬퍼.
 *
 * 서비스가 아니라 팩토리다. 카메라 스트림은 화면 하나가 독점하는 자원이라
 * 여러 컴포넌트가 같은 인스턴스를 공유하면 한쪽이 끄는 순간 다른 쪽이 검게 죽는다.
 *
 * 함정 세 가지를 여기서 흡수한다.
 * ① 화면을 떠날 때 track 을 멈추지 않으면 카메라 표시등이 계속 켜져 있다.
 * ② iOS Safari 는 `playsinline` 이 없으면 전체화면 재생으로 튄다 — 템플릿 쪽 책임이라
 *    여기서는 막지 못한다. `photo-capture` 템플릿에 붙여 두었다.
 * ③ HTTPS(또는 localhost)가 아니면 `mediaDevices` 자체가 없다. 없는 경우를 오류로 보지 않고
 *    `unsupported` 로 구분해 호출부가 파일 선택으로 갈아탈 수 있게 한다.
 */

/** 카메라 상태. 실패 사유를 나눠야 화면이 다른 안내를 보여줄 수 있다 */
export type CameraState =
  | 'idle' // 아직 켜지 않음
  | 'starting' // 권한 요청 중
  | 'live' // 미리보기 재생 중
  | 'denied' // 사용자가 권한을 거부
  | 'unsupported' // 카메라가 없거나 보안 컨텍스트가 아님
  | 'failed'; // 그 밖의 오류

export interface Camera {
  readonly state: Signal<CameraState>;
  /** 카메라를 켜고 `video` 에 물린다. 이미 켜져 있으면 아무것도 하지 않는다 */
  start(video: HTMLVideoElement): Promise<void>;
  /** 현재 프레임을 축소해 JPEG Blob 으로 뽑는다. 재생 중이 아니면 null */
  capture(video: HTMLVideoElement): Promise<Blob | null>;
  /** track 을 멈춘다. 화면을 떠날 때 반드시 부른다 */
  stop(): void;
}

export function createCamera(): Camera {
  const state = signal<CameraState>('idle');
  let stream: MediaStream | null = null;

  function stop(): void {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (state() === 'live' || state() === 'starting') state.set('idle');
  }

  async function start(video: HTMLVideoElement): Promise<void> {
    if (stream) return;

    // 보안 컨텍스트가 아니면 mediaDevices 자체가 없다. 권한 거부와 구분한다
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      state.set('unsupported');
      return;
    }

    state.set('starting');

    try {
      // 뒷면 카메라를 요청하되 없으면 앞면으로 떨어지도록 ideal 로 준다.
      // exact 로 주면 노트북처럼 뒷면이 없는 기기에서 통째로 실패한다.
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      video.srcObject = stream;
      await video.play();
      state.set('live');
    } catch (error) {
      stop();
      state.set(toFailureState(error));
    }
  }

  async function capture(video: HTMLVideoElement): Promise<Blob | null> {
    if (state() !== 'live') return null;

    const { videoWidth, videoHeight } = video;
    if (videoWidth === 0 || videoHeight === 0) return null;

    // 축소와 인코딩 규격은 파일 선택 경로와 같아야 한다 — core/image.ts 한 곳에 둔다
    return toJpeg(drawScaled(video, videoWidth, videoHeight));
  }

  return { state: state.asReadonly(), start, capture, stop };
}

/**
 * 실패 사유를 상태로 옮긴다.
 *
 * 브라우저마다 이름이 조금씩 다르다. 권한 거부는 `NotAllowedError`,
 * 카메라 없음은 `NotFoundError` · `OverconstrainedError` 로 온다.
 */
function toFailureState(error: unknown): CameraState {
  const name = error instanceof Error ? error.name : '';

  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'unsupported';
  return 'failed';
}
