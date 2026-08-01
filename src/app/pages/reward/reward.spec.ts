import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Reward } from './reward';

describe('Reward', () => {
  let component: Reward;
  let fixture: ComponentFixture<Reward>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reward],
      // 라우터 링크와 서비스의 HttpClient 주입에 필요하다
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Reward);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
