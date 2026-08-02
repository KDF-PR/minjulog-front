/**
 * 업로드 전 사진 정규화.
 *
 * 카메라로 찍은 프레임과 사용자가 고른 파일이 같은 규격으로 서버에 가야 한다.
 * 한쪽만 줄이면 갤러리에서 고른 사진이 그대로 올라가 10MB 제한에 걸린다.
 *
 * 형식도 여기서 통일한다. 아이폰 기본 설정은 HEIC 로 저장하는데 백엔드가 받는 형식은
 * jpg · png · webp 뿐이다. 캔버스를 거치면 무엇으로 들어오든 JPEG 로 나간다 —
 * 브라우저가 그 형식을 읽을 수만 있으면 된다.
 *
 * 읽지 못하는 형식은 `decode` 단계에서 예외가 난다. 호출부가 잡아서 안내로 바꾼다.
 */

/** 긴 변 기준 최대 크기. 백엔드 10MB 제한을 넘기지 않으려는 값이다 */
export const MAX_EDGE = 1600;

/** JPEG 품질. 0.85 아래로 내리면 실내 사진에서 얼룩이 눈에 띈다 */
export const JPEG_QUALITY = 0.85;

/**
 * 사진 하나를 업로드할 수 있는 형태로 바꾼다.
 *
 * 긴 변을 `MAX_EDGE` 이하로 줄이고 JPEG 로 다시 인코딩한다.
 * 이미 작아도 형식을 맞춰야 하므로 건너뛰지 않는다.
 *
 * @throws 브라우저가 읽지 못하는 형식이면 예외
 */
export async function toUploadPhoto(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);

  try {
    const canvas = drawScaled(bitmap, bitmap.width, bitmap.height);
    return await toJpeg(canvas);
  } finally {
    // 디코딩한 원본을 붙들고 있으면 큰 사진에서 메모리가 눈에 띄게 는다
    bitmap.close();
  }
}

/**
 * 원본 비율을 지키며 긴 변이 `MAX_EDGE` 이하가 되도록 캔버스에 그린다.
 * 이미 작으면 그대로 그린다 — 늘리지 않는다.
 */
export function drawScaled(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('캔버스 2d 컨텍스트를 만들지 못했다');

  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** 캔버스를 JPEG Blob 으로 뽑는다 */
export function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('JPEG 로 바꾸지 못했다'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}
