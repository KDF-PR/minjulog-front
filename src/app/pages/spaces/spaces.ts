import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { TabBar } from '../../shared/tab-bar/tab-bar';
import { IntroDialog } from '../../shared/intro-dialog/intro-dialog';
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
  imports: [PageHeader, TabBar, IntroDialog, RouterLink],
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
