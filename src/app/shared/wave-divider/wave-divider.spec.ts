import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaveDivider } from './wave-divider';

// 한 화면에 두 개를 서로 다른 색으로 놓는 상황을 재현한다.
@Component({
  imports: [WaveDivider],
  template: `
    <app-wave-divider class="first" style="--wave-top-color: #315ee8"></app-wave-divider>
    <app-wave-divider class="second" style="--wave-top-color: #fff8e8"></app-wave-divider>
  `,
})
class TwoDividersHost {}

describe('WaveDivider', () => {
  let fixture: ComponentFixture<WaveDivider>;
  let component: WaveDivider;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaveDivider, TwoDividersHost],
    }).compileComponents();

    fixture = TestBed.createComponent(WaveDivider);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('장식이라 스크린리더에서 제외한다', () => {
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('물결을 그리는 요소 하나만 둔다', () => {
    expect(host.querySelectorAll('.wave-divider').length).toBe(1);
  });

  // <pattern> 대신 CSS mask 를 쓰는 이유가 id 충돌 회피다.
  // id 가 하나도 없으면 인스턴스를 몇 개 놓아도 서로 참조가 섞이지 않는다.
  it('id 를 쓰지 않아 인스턴스끼리 충돌하지 않는다', () => {
    expect(host.querySelectorAll('[id]').length).toBe(0);
  });

  it('인라인 style 로 색 변수를 덮어쓴다', () => {
    host.style.setProperty('--wave-line-color', '#17315c');

    expect(host.style.getPropertyValue('--wave-line-color')).toBe('#17315c');
  });

  it('두 인스턴스가 서로 다른 색 변수를 갖는다', async () => {
    const hostFixture = TestBed.createComponent(TwoDividersHost);
    await hostFixture.whenStable();

    const root = hostFixture.nativeElement as HTMLElement;
    const first = root.querySelector<HTMLElement>('.first')!;
    const second = root.querySelector<HTMLElement>('.second')!;

    expect(first.style.getPropertyValue('--wave-top-color')).toBe('#315ee8');
    expect(second.style.getPropertyValue('--wave-top-color')).toBe('#fff8e8');
  });
});
