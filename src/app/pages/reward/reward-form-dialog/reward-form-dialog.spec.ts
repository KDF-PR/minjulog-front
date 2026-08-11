import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RewardFormDialog } from './reward-form-dialog';

describe('RewardFormDialog', () => {
  let component: RewardFormDialog;
  let fixture: ComponentFixture<RewardFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RewardFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(RewardFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
