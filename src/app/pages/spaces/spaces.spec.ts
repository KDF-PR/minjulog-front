import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Spaces } from './spaces';

describe('Spaces', () => {
  let component: Spaces;
  let fixture: ComponentFixture<Spaces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Spaces],
      // 라우터 링크와 서비스의 HttpClient 주입에 필요하다
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Spaces);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
