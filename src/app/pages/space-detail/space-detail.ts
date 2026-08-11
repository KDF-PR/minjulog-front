import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/layout/page-header/page-header';
import { MapLinks } from '../../shared/ui/map-links/map-links';
import { StampBadge } from '../../shared/ui/stamp-badge/stamp-badge';
import { LazyLoadImg } from '../../shared/ui/lazy-load-img/lazy-load-img';
import { PhotoService } from '../../core/photo.service';
import { SpaceService } from '../../core/space.service';
import { LoadState, SpaceSectionType } from '../../core/models';
import { ScrollTopDirective } from '../../shared/directives/scroll-top.directive';
import { PhotoGuideSheet } from './photo-guide-sheet/photo-guide-sheet';
import { WaveDivider } from '../../shared/layout/wave-divider/wave-divider';

/** 섹션 종류별 기본 제목·아이콘. 데이터의 `title` 이 있으면 그쪽이 이긴다 */
const SECTION_DEFAULTS: Record<SpaceSectionType, { title: string; icon: string }> = {
  map: { title: '찾아가는 길', icon: 'map' },
  story: { title: '이곳의 이야기', icon: 'letter' },
  viewPoints: { title: '자세히 둘러보면 좋을 곳', icon: 'flower' },
  visitInfo: { title: '관람 정보', icon: 'letter' }, // 전용 아이콘 자산 미수령
};

/**
 * 03 방문할 곳 상세.
 *
 * 선택 항목이 비어 있는 장소가 있어 없으면 영역을 통째로 숨긴다 — 빈 값을 그리면 라벨만 남는다.
 * 하단은 탭바가 아니라 목록으로 가기 + 인증 버튼이다. 탭 이동을 걸어두면 인증 흐름이 끊긴다.
 */
@Component({
  selector: 'app-space-detail',
  imports: [
    PageHeader,
    MapLinks,
    StampBadge,
    LazyLoadImg,
    ScrollTopDirective,
    PhotoGuideSheet,
    WaveDivider,
  ],
  templateUrl: './space-detail.html',
  styleUrl: './space-detail.scss',
})
export class SpaceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private spaces = inject(SpaceService);
  private photos = inject(PhotoService);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);
  protected readonly loadState = signal<LoadState>('idle');
  /** P1 안내 시트. 인증 버튼이 열고, 「확인했어요」가 촬영으로 잇는다 */
  protected readonly guideOpen = signal(false);

  protected readonly sectionDefaults = SECTION_DEFAULTS;

  private readonly slug = signal('');

  protected readonly spaceVisit = computed(() => this.spaces.findVisitBySlug(this.slug()));
  protected readonly isVisited = computed(() => this.spaceVisit()?.visit != null);

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.slug.set(this.route.snapshot.paramMap.get('slug') ?? '');
    this.load();
  }

  /** 히스토리를 되돌리면 카메라(`/stamp/:slug`)로 돌아갈 수 있어 항상 목록으로 보낸다 */
  protected goToList(): void {
    this.router.navigate(['/spaces']);
  }

  protected openGuide(): void {
    this.guideOpen.set(true);
  }

  protected closeGuide(): void {
    this.guideOpen.set(false);
  }

  /** 안내 시트의 「확인했어요」 — 시트를 닫고 촬영 화면으로 보낸다 */
  protected startCapture(): void {
    this.guideOpen.set(false);
    this.router.navigate(['/stamp', this.slug()]);
  }

  /** 콘텐츠는 프론트가 들고 있어 바로 그린다. 여기서 기다리는 것은 방문 여부 하나다 */
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
