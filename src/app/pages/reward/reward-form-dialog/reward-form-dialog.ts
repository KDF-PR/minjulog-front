import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

/** 신청 폼이 부모에게 올리는 값. 서비스가 이 모양을 받게 되면 `core/models.ts` 로 승격 */
export interface RewardApplication {
  name: string;
  /** 숫자만 남긴 연락처 — 화면 입력에 `-` 가 있든 없든 서버로는 같은 모양 */
  phone: string;
  address: string;
}

/** 하이픈 유무 무관. 지역번호(02)와 휴대폰(010) 모두 통과 */
const PHONE_PATTERN = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

/**
 * R2 신청 정보 입력 dialog — 이름 · 연락처 · 주소 + 개인정보 수집 동의.
 *
 * 여닫기는 `open` 입력으로 부모가 관리하고, 이 컴포넌트는 값을 모아 `apply` 로 전달만 함.
 * 여기서 서비스를 직접 부르면 리워드 화면이 쥔 신청 상태와 두 곳으로 갈림.
 *
 * **오류 문구와 필수 여부 확정본 미수령** (`docs/pages.md` R2 「막힌 것」).
 * 현재는 네 값 모두 필수 && 문구도 자리 문구.
 */
@Component({
  selector: 'app-reward-form-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './reward-form-dialog.html',
  styleUrl: './reward-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RewardFormDialog {
  private fb = inject(FormBuilder);

  readonly open = input(false);

  /** 부모가 신청을 처리하는 동안 버튼 잠금 */
  readonly submitting = input(false);

  readonly apply = output<RewardApplication>();
  readonly close = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    address: ['', [Validators.required]],
    agree: [false, [Validators.requiredTrue]],
  });

  /**
   * 오류 표시 기준은 touched 가 아니라 dirty.
   * dialog 가 열리며 포커스만 옮겨가도 touched 가 되어 입력 전부터 「입력해주세요」 노출됨.
   */
  protected showError(control: AbstractControl): boolean {
    return control.invalid && control.dirty;
  }

  protected save(): void {
    if (this.form.invalid || this.submitting()) return;

    const { name, phone, address } = this.form.getRawValue();
    this.apply.emit({
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      address: address.trim(),
    });
  }

  protected cancel(): void {
    this.close.emit();
  }
}
