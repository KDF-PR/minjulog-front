import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { MyLog } from './my-log';
import { installIntersectionObserverMock } from '../../shared/ui/lazy-load-img/intersection-observer.mock';

describe('MyLog', () => {
  let component: MyLog;
  let fixture: ComponentFixture<MyLog>;

  beforeEach(async () => {
    // 카드 썸네일이 app-lazy-load-img 라 jsdom 에 없는 IntersectionObserver 를 채워야 한다
    installIntersectionObserverMock();

    await TestBed.configureTestingModule({
      imports: [MyLog],
      // 라우터 링크와 서비스의 HttpClient 주입에 필요하다
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(MyLog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
