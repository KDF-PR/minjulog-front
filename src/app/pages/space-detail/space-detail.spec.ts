import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { SpaceDetail } from './space-detail';

describe('SpaceDetail', () => {
  let component: SpaceDetail;
  let fixture: ComponentFixture<SpaceDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpaceDetail],
      // 라우터 링크와 서비스의 HttpClient 주입에 필요하다
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(SpaceDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
