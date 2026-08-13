/**
 * 방문 인증 사진. 업로드와 방문 목록 담당.
 *
 * 방문 여부를 보는 화면이 넷이다 — 방문 현황 그리드 · 목록의 완료 표시 · 상세 버튼 ·
 * 리워드 진행률. 그래서 여기 한 곳에서 signal 로 들고 화면은 computed 로 파생.
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, catchError, delay, finalize, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { PhotoDto, PhotosResponseDto, UploadPhotoResponseDto } from './api.dto';
import { toVisit, toVisitFromUpload } from './api.mapper';
import { Visit } from './models';
import { activeMockScenario, buildVisitsMock } from './mock/visits.mock';
import { mockSignedIn } from './mock/user.mock';

/** mock 응답 지연(ms) — 로딩 상태가 화면에 보이도록 */
const MOCK_LATENCY = 300;

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  private readonly visits = signal<Visit[]>([]);
  private readonly uploading = signal(false);

  /** 방문한 장소의 백엔드 uuid 집합 */
  readonly visitedSpaceIds = computed(() => new Set(this.visits().map((visit) => visit.spaceId)));
  readonly visitedCount = computed(() => this.visitedSpaceIds().size);
  readonly isUploading = this.uploading.asReadonly();
  readonly visitList = this.visits.asReadonly();

  hasVisited(spaceId: string): boolean {
    return this.visitedSpaceIds().has(spaceId);
  }

  findVisit(spaceId: string): Visit | undefined {
    return this.visits().find((visit) => visit.spaceId === spaceId);
  }

  /** 방문 목록 조회: `GET /api/photos` */
  loadVisits(): Observable<Visit[]> {
    // mock 전환 지점 — Supabase 준비 후 environment.useMockApi = false
    // 401 은 오류가 아니라 비로그인 정상 상태 → 전부 미방문으로 표시
    // (`app.py:441` @login_required · 비로그인 탐색은 `docs/요구사항정의.md` 5장)
    // mock 도 같은 규칙 — 로그인 전(DEV 패널)이면 실제 401 때처럼 빈 목록
    const source: Observable<PhotoDto[]> = environment.useMockApi
      ? of(mockSignedIn() ? buildVisitsMock(activeMockScenario()) : []).pipe(delay(MOCK_LATENCY))
      : this.http.get<PhotosResponseDto>(`${this.base}/api/photos`).pipe(
          map((res) => res.photos),
          catchError((err) => (err?.status === 401 ? of([]) : throwError(() => err))),
        );

    return source.pipe(
      map((photos) => photos.map(toVisit)),
      tap((visits) => this.visits.set(visits)),
    );
  }

  /**
   * 사진 제출: `POST /api/photos/upload` (multipart/form-data)
   *
   * 같은 장소에 다시 올리면 백엔드가 이전 사진을 덮어씀 — 오류가 아니라 정상 처리.
   * 리워드 신청 후에도 교체 가능 (`docs/요구사항정의.md` 6장).
   *
   * **`Content-Type` 을 직접 넣지 않는다.** 브라우저가 boundary 를 포함해 만들어야 파일이 인식됨.
   */
  uploadPhoto(spaceId: string, photo: Blob): Observable<Visit> {
    // 빈 spaceId 는 SpaceService 의 응답 전 초기값 → 서버로 보내지 않고 오류로 반환
    if (!spaceId) return throwError(() => new Error('spaceId 이전에 장소 목록 응답이 필요하다'));
    if (this.uploading()) return EMPTY; // 중복 제출 차단
    this.uploading.set(true);

    // mock 전환 지점 — 실제 업로드 없이 방문 기록만 생성
    const source: Observable<UploadPhotoResponseDto> = environment.useMockApi
      ? of({
          message: '업로드되었습니다.',
          url: URL.createObjectURL(photo),
          path: `mock/${spaceId}/photo.jpg`,
        }).pipe(delay(MOCK_LATENCY))
      : this.http.post<UploadPhotoResponseDto>(
          `${this.base}/api/photos/upload`,
          buildUploadForm(spaceId, photo),
        );

    return source.pipe(
      map((res) => toVisitFromUpload(res, spaceId)),
      tap((visit) => this.upsertVisit(visit)),
      finalize(() => this.uploading.set(false)),
    );
  }

  /** 장소당 1건이라 같은 spaceId 는 교체 */
  private upsertVisit(visit: Visit): void {
    this.visits.update((current) => [
      visit,
      ...current.filter((item) => item.spaceId !== visit.spaceId),
    ]);
  }
}

function buildUploadForm(spaceId: string, photo: Blob): FormData {
  const form = new FormData();
  form.append('photo', photo, 'photo.jpg');
  form.append('space_id', spaceId);
  return form;
}
