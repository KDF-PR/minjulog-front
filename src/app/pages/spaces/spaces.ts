import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { WaveDivider } from '../../shared/wave-divider/wave-divider';
import { TabBar } from '../../shared/tab-bar/tab-bar';
import { IntroDialog } from '../../shared/intro-dialog/intro-dialog';
import { MapLinks } from '../../shared/map-links/map-links';
import { StampBadge } from '../../shared/stamp-badge/stamp-badge';
import { PhotoService } from '../../core/photo.service';
import { SpaceService } from '../../core/space.service';
import { LoadState } from '../../core/models';
import { ScrollTopDirective } from '../../utils/scroll-top.directive';
import { LazyLoadImg } from '../../shared/lazy-load-img/lazy-load-img';

/**
 * 03 방문할 곳 — 참여 기관 목록.
 *
 * 행마다 방문 여부가 필요해 `SpaceVisit` 를 그대로 받는다. 따로 조회해 짝지으면 순서가 어긋난다.
 */
@Component({
  selector: 'app-spaces',
  imports: [
    PageHeader,
    TabBar,
    IntroDialog,
    MapLinks,
    StampBadge,
    RouterLink,
    ScrollTopDirective,
    LazyLoadImg,
    WaveDivider,
  ],
  templateUrl: './spaces.html',
  styleUrl: './spaces.scss',
})
export class Spaces implements OnInit {
  private spaces = inject(SpaceService);
  private photos = inject(PhotoService);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);
  /** 목록은 프론트 콘텐츠로 즉시 그리므로 오류 안내에만 쓴다 */
  protected readonly loadState = signal<LoadState>('idle');
  protected readonly introOpen = signal(false);

  protected readonly spaceVisits = this.spaces.spaceVisits;
  protected readonly totalCount = this.spaces.totalCount;

  /** 여섯 곳을 모아 볼 지도 목록 주소가 아직 없어 첫 장소 이름으로 검색을 연다 — `docs/할일.md` D-2 */
  protected readonly mapQuery = computed(() => this.spaceVisits()[0]?.space.name ?? '민주로그');

  ngOnInit(): void {
    requestAnimationFrame(() => this.ready.set(true));
    this.load();
  }

  protected openIntro(): void {
    this.introOpen.set(true);
  }

  protected closeIntro(): void {
    this.introOpen.set(false);
  }

  /** 두 호출은 서로 의존하지 않아 병렬로 부른다. 완료되면 배지가 방문 상태로 갱신된다 */
  private load(): void {
    this.loadState.set('loading');
    forkJoin([this.spaces.loadSpaces(), this.photos.loadVisits()]).subscribe({
      next: () => this.loadState.set('ready'),
      error: () => this.loadState.set('error'),
    });
  }
}
