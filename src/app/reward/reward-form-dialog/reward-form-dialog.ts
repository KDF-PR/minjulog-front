import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

/** 신청 폼이 부모에게 올리는 값. 서비스가 이 모양을 받게 되면 `core/models.ts` 로 올린다. */
export interface RewardApplication {
  name: string;
  /** 숫자만 남긴 연락처 — 화면에서 `-` 를 넣든 말든 서버로는 같은 모양으로 간다 */
  phone: string;
  address: string;
}

/** 하이픈이 있어도 없어도 받는다. 지역번호(02)와 휴대폰(010) 모두 통과 */
const PHONE_PATTERN = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

/**
 * R2 신청 정보 입력 dialog — 이름 · 연락처 · 주소 + 개인정보 수집 동의.
 *
 * `IntroDialog` 와 같은 방식이다. 여닫기는 `open` 입력으로 부모가 쥐고, 이 컴포넌트는
 * 값을 모아 `apply` 로 올리기만 한다. 여기서 서비스를 직접 부르면 04 리워드 화면이
 * 쥐고 있는 신청 상태(어느 단계를 신청 중인지)와 두 곳으로 갈린다.
 *
 * 골격(`.dialog-dim` / `.dialog`)은 `templates/_dialog.scss` 가, 라벨·입력칸·오류 문구
 * (`.field-*`)는 `templates/_form.scss` 가 전역 1회 방출한다.
 *
 * **오류 문구와 필수 여부는 확정본을 받지 못했다** (`docs/pages.md` R2 「막힌 것」).
 * 지금은 네 값 모두 필수로 잡았고 문구도 자리 문구다.
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

  /** 부모가 신청을 처리하는 동안 버튼을 잠근다 */
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
   * 오류 표시 기준을 touched 가 아니라 dirty 로 둔다.
   * dialog 가 열리며 포커스만 옮겨가도 touched 가 되어, 아직 아무것도 입력하지 않았는데
   * 「입력해주세요」가 뜬다. 값을 실제로 고친 뒤에만 표시한다.
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
