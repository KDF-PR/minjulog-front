import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { MyLog } from './my-log';

describe('MyLog', () => {
  let component: MyLog;
  let fixture: ComponentFixture<MyLog>;

  beforeEach(async () => {
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
