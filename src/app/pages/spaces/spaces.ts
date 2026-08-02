import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { TabBar } from '../../shared/tab-bar/tab-bar';
import { IntroDialog } from '../../shared/intro-dialog/intro-dialog';
import { MapLinks } from '../../shared/map-links/map-links';
import { PhotoService } from '../../core/photo.service';
import { SpaceService } from '../../core/space.service';
import { LoadState } from '../../core/models';

/**
 * 03 방문할 곳 — 참여 기관 목록.
 *
 * 행마다 방문 여부를 보여주므로 `SpaceVisit`(장소 + 그 사용자의 방문)을 그대로 받는다.
 * 장소와 방문을 따로 조회해 화면에서 짝지으면 두 목록의 순서가 어긋난다.
 */
@Component({
  selector: 'app-spaces',
  imports: [PageHeader, TabBar, IntroDialog, MapLinks, RouterLink],
  templateUrl: './spaces.html',
  styleUrl: './spaces.scss',
})
export class Spaces implements OnInit {
  private spaces = inject(SpaceService);
  private photos = inject(PhotoService);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);
  protected readonly loadState = signal<LoadState>('idle');
  protected readonly introOpen = signal(false);

  protected readonly spaceVisits = this.spaces.spaceVisits;
  protected readonly totalCount = this.spaces.totalCount;

  /**
   * 하단 「지도 앱에서 모아보기」 검색어.
   *
   * 여섯 곳을 한 번에 띄우려면 지도 앱마다 미리 만든 목록 주소가 필요한데 아직 없다.
   * 그때까지는 첫 장소 이름으로 검색을 연다 — `docs/할일.md` D-2.
   */
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
