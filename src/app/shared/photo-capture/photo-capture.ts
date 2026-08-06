import {
  Component,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { createCamera } from '../../core/camera';
import { toUploadPhoto } from '../../core/image';

type CaptureStep = 'preview' | 'review';

/**
 * 사진 인증 촬영기. 확인 단계를 거쳐 `photoConfirm` 으로 Blob 을 내보낸다.
 * 카메라를 못 쓰면(권한 거부·기기 없음·HTTPS 아님) 파일 선택으로 갈아탄다.
 * 미리보기 URL 은 교체·소멸 시 해제한다 — 안 하면 다시 찍기마다 사진이 메모리에 쌓인다.
 */
@Component({
  selector: 'app-photo-capture',
  imports: [],
  templateUrl: './photo-capture.html',
  styleUrl: './photo-capture.scss',
})
export class PhotoCapture implements OnDestroy {
  /** 어디를 찍는지 알려주는 안내 문구 */
  readonly guide = input('');
  /** 업로드 중이면 버튼을 잠근다. 상위가 서비스 상태를 넘겨준다 */
  readonly uploading = input(false);

  readonly photoConfirm = output<Blob>();
  readonly cancel = output<void>();

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  private readonly camera = createCamera();

  protected readonly cameraState = this.camera.state;
  protected readonly step = signal<CaptureStep>('preview');
  protected readonly previewUrl = signal<string | null>(null);
  /** 고른 파일을 읽지 못했을 때만 채운다. 카메라 상태 안내와 자리를 나눠 쓴다 */
  protected readonly fileError = signal('');

  private captured: Blob | null = null;

  /** 세 가지 실패를 파일 선택 한 갈래로 묶는다 */
  protected readonly usesFile = computed(() => {
    const state = this.cameraState();
    return state === 'denied' || state === 'unsupported' || state === 'failed';
  });

  protected readonly stateMessage = computed(() => {
    switch (this.cameraState()) {
      case 'starting':
        return '카메라를 여는 중이에요';
      case 'denied':
        return '카메라 사용을 허용하지 않았어요. 사진을 골라서 올려도 돼요';
      case 'unsupported':
        return '이 기기에서는 카메라를 열 수 없어요. 사진을 골라서 올려 주세요';
      case 'failed':
        return '카메라를 열지 못했어요. 사진을 골라서 올려 주세요';
      default:
        return '';
    }
  });

  constructor() {
    // video 요소가 렌더 이후에 붙어 effect 로 기다린다.
    // 확인 단계에서는 미리보기를 멈춰 배터리와 카메라 표시등을 아낀다.
    effect(() => {
      const element = this.video()?.nativeElement;
      if (!element) return;

      if (this.step() === 'preview') {
        void this.camera.start(element);
      } else {
        this.camera.stop();
      }
    });
  }

  ngOnDestroy(): void {
    this.camera.stop();
    this.revokePreview();
  }

  protected async onShutter(): Promise<void> {
    const element = this.video()?.nativeElement;
    if (!element) return;

    const blob = await this.camera.capture(element);
    if (!blob) return;

    this.setCaptured(blob);
  }

  /**
   * 카메라 대체 경로. 갤러리 원본은 크고 아이폰 기본은 HEIC 라
   * 촬영 경로와 같은 규격으로 변환해 넘긴다.
   */
  protected async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // 같은 파일을 다시 골라도 change 가 나게 비운다
    if (!file) return;

    this.fileError.set('');

    try {
      this.setCaptured(await toUploadPhoto(file));
    } catch {
      // 브라우저가 못 읽는 형식이다. 어떤 형식인지까지는 알려줄 수 없다
      this.fileError.set('이 사진은 열지 못했어요. 다른 사진을 골라 주세요');
    }
  }

  protected onRetake(): void {
    this.fileError.set('');
    this.revokePreview();
    this.captured = null;
    this.step.set('preview');
  }

  protected onConfirm(): void {
    if (!this.captured || this.uploading()) return;
    this.photoConfirm.emit(this.captured);
  }

  protected onCancel(): void {
    this.cancel.emit();
  }

  private setCaptured(blob: Blob): void {
    this.revokePreview();
    this.captured = blob;
    this.previewUrl.set(URL.createObjectURL(blob));
    this.step.set('review');
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }
}
