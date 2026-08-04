import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LazyLoadImageDirective } from 'ng-lazyload-image';

import { LazyLoadImg } from './lazy-load-img';
import { installIntersectionObserverMock } from './intersection-observer.mock';

describe('LazyLoadImg', () => {
  let fixture: ComponentFixture<LazyLoadImg>;
  let host: HTMLElement;

  // 화면에 실제로 붙는 디렉티브. 두 경로가 여기로 잘 넘어갔는지로 판정한다.
  // componentInstance 는 호스트 컴포넌트를 주므로 injector 에서 직접 꺼낸다.
  const directive = () =>
    fixture.debugElement
      .query(By.directive(LazyLoadImageDirective))
      .injector.get(LazyLoadImageDirective);

  const img = () => host.querySelector('img')!;

  beforeEach(async () => {
    installIntersectionObserverMock();

    await TestBed.configureTestingModule({
      imports: [LazyLoadImg],
    }).compileComponents();

    fixture = TestBed.createComponent(LazyLoadImg);
    host = fixture.nativeElement as HTMLElement;
  });

  // 라이브러리 디렉티브가 standalone 이 아니라 NgModule 로 가져온다.
  // 모듈이 함께 넘겨주는 LAZYLOAD_IMAGE_HOOKS 가 실제로 주입되는지까지 이 테스트가 확인한다.
  it('should create', async () => {
    fixture.componentRef.setInput('src', 'assets/images/main/graphics/tape');
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
    expect(img()).toBeTruthy();
  });

  it('기본값은 @0.5x 를 깔고 @2x 로 바꿔 끼운다', async () => {
    fixture.componentRef.setInput('src', 'assets/images/main/graphics/tape');
    await fixture.whenStable();

    expect(directive().defaultImage).toBe('assets/images/main/graphics/tape@0.5x.png');
    expect(directive().lazyImage).toBe('assets/images/main/graphics/tape@2x.png');
  });

  it('확장자를 바꾸면 두 경로에 함께 반영된다', async () => {
    fixture.componentRef.setInput('src', 'assets/images/main/graphics/tape');
    fixture.componentRef.setInput('ext', 'webp');
    await fixture.whenStable();

    expect(directive().defaultImage).toBe('assets/images/main/graphics/tape@0.5x.webp');
    expect(directive().lazyImage).toBe('assets/images/main/graphics/tape@2x.webp');
  });

  // 백엔드 업로드 사진은 주소가 하나뿐이라 suffix 를 붙이면 없는 주소가 된다.
  it('scaled 를 끄면 주소를 그대로 쓰고 자리표시자를 두지 않는다', async () => {
    fixture.componentRef.setInput('src', 'https://example.test/visit/abc.jpg');
    fixture.componentRef.setInput('scaled', false);
    await fixture.whenStable();

    expect(directive().lazyImage).toBe('https://example.test/visit/abc.jpg');
    expect(directive().defaultImage).toBe('');
  });

  it('alt 를 넘기지 않으면 장식 이미지로 비워 둔다', async () => {
    fixture.componentRef.setInput('src', 'assets/images/main/graphics/tape');
    await fixture.whenStable();

    expect(img().getAttribute('alt')).toBe('');
  });

  it('alt 를 넘기면 그대로 붙는다', async () => {
    fixture.componentRef.setInput('src', 'assets/images/spaces/myeongdong-cathedral');
    fixture.componentRef.setInput('alt', '명동성당 대표 이미지');
    await fixture.whenStable();

    expect(img().getAttribute('alt')).toBe('명동성당 대표 이미지');
  });
});
