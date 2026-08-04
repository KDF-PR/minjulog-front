/**
 * 테스트용 `IntersectionObserver` 스텁.
 *
 * jsdom 에는 `IntersectionObserver` 가 없다. `ng-lazyload-image` 는 화면 진입 감시에 이걸
 * 쓰므로, 스텁이 없으면 디렉티브의 `ngAfterContentInit` 에서 `ReferenceError` 로 죽는다.
 *
 * `LazyLoadImg` 를 쓰는 화면의 스펙은 `beforeEach` 에서 `installIntersectionObserverMock()`
 * 을 부른다. 감시 자체를 검증할 일이 없어서 아무 동작도 하지 않는다 —
 * 이미지가 화면에 들어왔다고 알리지 않으므로 실제 로딩까지 가지 않는다.
 */
export class IntersectionObserverMock {
  constructor(
    readonly callback: unknown,
    readonly options?: unknown,
  ) {}

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}

  takeRecords(): [] {
    return [];
  }
}

export function installIntersectionObserverMock(): void {
  (globalThis as unknown as Record<string, unknown>)['IntersectionObserver'] =
    IntersectionObserverMock;
}
