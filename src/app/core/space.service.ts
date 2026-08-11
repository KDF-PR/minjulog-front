/**
 * 장소 6곳의 **고정 정보**.
 *
 * 사용자 상태(방문 여부)는 `PhotoService` 담당. 둘이 함께 필요한 화면은 `spaceVisits` 로 수령.
 * 나눠두면 로그인 전에도 장소 목록을 그대로 사용 가능.
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SpaceDto, SpacesResponseDto } from './api.dto';
import { toSpace } from './api.mapper';
import { ProgressState, REWARD_TIERS, Space, SpaceVisit } from './models';
import { REQUIRED_SPACE_SLUG, SPACES_CONTENT, findContentByName } from './spaces.content';
import { SPACES_MOCK } from './mock/spaces.mock';
import { PhotoService } from './photo.service';

/** mock 응답 지연(ms) — 로딩 상태가 화면에 보이도록 */
const MOCK_LATENCY = 300;

/** 1차 리워드 기준 방문 수 */
const FIRST_TIER = REWARD_TIERS[0];

/**
 * 응답 전에도 목록을 그릴 초기값.
 *
 * 목록이 쓰는 값(이름 · 지역 · 마크 색 · slug)은 전부 프론트 콘텐츠라 서버 대기 불필요.
 * 서버만 아는 값은 uuid 하나. `spaceId: ''` 는 "아직 서버 값이 아님" 표시이고,
 * 이 빈 값이 업로드로 새지 않도록 `PhotoService.uploadPhoto()` 가 차단.
 */
const INITIAL_SPACES: Space[] = SPACES_CONTENT.map((content) => ({
  ...content,
  spaceId: '',
  isRequired: content.slug === REQUIRED_SPACE_SLUG,
})).sort((a, b) => a.courseOrder - b.courseOrder);

@Injectable({ providedIn: 'root' })
export class SpaceService {
  private http = inject(HttpClient);
  private photos = inject(PhotoService);
  private base = environment.apiBase;

  private readonly spaceList = signal<Space[]>(INITIAL_SPACES);

  /**
   * 장소 목록 — 고정 정보만. 추천 코스 순번으로 정렬.
   * 백엔드는 이름 오름차순으로 주지만 표시 순서는 프론트가 결정.
   */
  readonly spaces = this.spaceList.asReadonly();

  /** 장소 + 그 사용자의 방문 상태. 목록·상세 화면이 사용 */
  readonly spaceVisits = computed<SpaceVisit[]>(() =>
    this.spaceList().map((space) => ({
      space,
      visit: this.photos.findVisit(space.spaceId) ?? null,
    })),
  );

  readonly requiredSpace = computed(() => this.spaceList().find((space) => space.isRequired));
  readonly totalCount = computed(() => this.spaceList().length);

  readonly visitedCount = computed(
    () => this.spaceVisits().filter((item) => item.visit !== null).length,
  );

  readonly hasVisitedRequired = computed(() =>
    this.spaceVisits().some((item) => item.space.isRequired && item.visit !== null),
  );

  /**
   * 방문 현황 화면 상태 — 디자인 `02`~`06`.
   * **방문 수만으로 갈리지 않는다.** 3곳을 채워도 필수를 안 갔으면 `04` 안내.
   */
  readonly progressState = computed<ProgressState>(() => {
    const count = this.visitedCount();
    const total = this.totalCount();

    if (count === 0) return 'empty';
    if (total > 0 && count === total) return 'allComplete';
    if (count >= FIRST_TIER) return this.hasVisitedRequired() ? 'firstComplete' : 'requiredMissing';
    return 'inProgress';
  });

  findBySlug(slug: string): Space | undefined {
    return this.spaceList().find((space) => space.slug === slug);
  }

  findVisitBySlug(slug: string): SpaceVisit | undefined {
    return this.spaceVisits().find((item) => item.space.slug === slug);
  }

  /** 장소 목록 조회: `GET /api/spaces` */
  loadSpaces(): Observable<Space[]> {
    // mock 전환 지점 — Supabase 준비 후 environment.useMockApi = false
    const source: Observable<SpaceDto[]> = environment.useMockApi
      ? of(SPACES_MOCK).pipe(delay(MOCK_LATENCY))
      : this.http.get<SpacesResponseDto>(`${this.base}/api/spaces`).pipe(map((res) => res.spaces));

    return source.pipe(
      map(mergeWithContent),
      tap((spaces) => this.spaceList.set(spaces)),
      // 401 은 오류가 아니라 비로그인 정상 상태다 — 목록은 프론트 콘텐츠(INITIAL_SPACES)로 그린다
      // (`app.py:349` @login_required · 비로그인 탐색은 `docs/요구사항정의.md` 5장)
      catchError((err) => (err?.status === 401 ? of(this.spaceList()) : throwError(() => err))),
    );
  }
}

/**
 * 백엔드 응답에 로컬 콘텐츠를 결합.
 *
 * 콘텐츠를 못 찾은 장소는 목록에서 제외. 지금은 이름 문자열로 잇고 있어
 * 백엔드에서 장소명을 바꾸면 **조용히 사라짐** → 그래서 경고를 남긴다.
 * `slug` 컬럼이 생기면 이 매칭 제거 (`docs/요구사항정의.md` 9장 ⑦).
 */
function mergeWithContent(dtos: SpaceDto[]): Space[] {
  return dtos
    .map((dto) => {
      const content = findContentByName(dto.name);
      if (!content) {
        console.warn(`[space] 콘텐츠를 찾지 못한 장소: "${dto.name}" (${dto.id})`);
        return null;
      }
      return toSpace(dto, content);
    })
    .filter((space): space is Space => space !== null)
    .sort((a, b) => a.courseOrder - b.courseOrder);
}
