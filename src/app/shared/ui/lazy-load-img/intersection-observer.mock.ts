/**
 * 테스트용 `IntersectionObserver` 스텁. jsdom 에 없어 `ng-lazyload-image` 가
 * `ReferenceError` 로 죽는 것을 막는다.
 * `LazyLoadImg` 를 쓰는 스펙은 `beforeEach` 에서 `installIntersectionObserverMock()` 을 부른다.
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
