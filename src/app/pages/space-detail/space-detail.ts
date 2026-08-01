import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { TabBar } from '../../shared/tab-bar/tab-bar';
import { IntroDialog } from '../../shared/intro-dialog/intro-dialog';
import { PhotoService } from '../../core/photo.service';
import { SpaceService } from '../../core/space.service';
import { LoadState } from '../../core/models';

/** 운영 정보 한 줄. 값이 없는 항목은 목록에서 뺀다 */
interface DetailFact {
  term: string;
  value: string;
}

/**
 * 03 방문할 곳 상세.
 *
 * 콘텐츠(주소·설명·관람 정보)는 프론트가 들고 있고 방문 여부만 사용자 상태다.
 * 선택 항목이 비어 있는 장소가 있어 **없으면 그 영역을 통째로 숨긴다** — 빈 값을 그리면
 * 라벨만 남은 줄이 생긴다.
 */
@Component({
  selector: 'app-space-detail',
  imports: [PageHeader, TabBar, IntroDialog],
  templateUrl: './space-detail.html',
  styleUrl: './space-detail.scss',
})
export class SpaceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private spaces = inject(SpaceService);
  private photos = inject(PhotoService);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);
  protected readonly loadState = signal<LoadState>('idle');
  protected readonly introOpen = signal(false);

  private readonly slug = signal('');

  protected readonly spaceVisit = computed(() => this.spaces.findVisitBySlug(this.slug()));
  protected readonly isVisited = computed(() => this.spaceVisit()?.visit != null);

  /** 요약 아래 칩 — 관람 시간·요금처럼 짧게 끊어 읽는 값만 올린다 */
  protected readonly highlights = computed<readonly string[]>(() => {
    const info = this.spaceVisit()?.space.visitInfo;
    return [info?.openingHours, info?.admissionFee].filter(
      (value): value is string => value !== undefined,
    );
  });

  protected readonly facts = computed<readonly DetailFact[]>(() => {
    const space = this.spaceVisit()?.space;
    if (!space) return [];

    const info = space.visitInfo;
    const rows: DetailFact[] = [];
    if (info?.openingHours) rows.push({ term: '관람 시간', value: info.openingHours });
    if (info?.note) rows.push({ term: '휴관일', value: info.note });
    if (info?.transit) rows.push({ term: '교통', value: info.transit });
    rows.push({ term: '주소', value: space.address });
    return rows;
  });

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.slug.set(this.route.snapshot.paramMap.get('slug') ?? '');
    this.load();
  }

  protected openIntro(): void {
    this.introOpen.set(true);
  }

  protected closeIntro(): void {
    this.introOpen.set(false);
  }

  private load(): void {
    this.loadState.set('loading');
    this.spaces
      .loadSpaces()
      .pipe(switchMap(() => this.photos.loadVisits()))
      .subscribe({
        next: () => this.loadState.set('ready'),
        error: () => this.loadState.set('error'),
      });
  }
}
