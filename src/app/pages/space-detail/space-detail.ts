import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs';
import { PageHeader } from '../../shared/page-header/page-header';
import { IntroDialog } from '../../shared/intro-dialog/intro-dialog';
import { MapLinks } from '../../shared/map-links/map-links';
import { StampBadge } from '../../shared/stamp-badge/stamp-badge';
import { PhotoService } from '../../core/photo.service';
import { SpaceService } from '../../core/space.service';
import { LoadState } from '../../core/models';
import { ScrollTopDirective } from '../../utils/scroll-top.directive';

/**
 * 03 방문할 곳 상세.
 *
 * 콘텐츠(주소·설명·둘러볼 곳)는 프론트가 들고 있고 방문 여부만 사용자 상태다.
 * 선택 항목이 비어 있는 장소가 있어 **없으면 그 영역을 통째로 숨긴다** — 빈 값을 그리면
 * 라벨만 남은 줄이 생긴다.
 *
 * 하단은 탭바가 아니라 뒤로 가기 + 인증 버튼이다. 목록에서 들어와 사진을 올리고
 * 돌아가는 흐름이라 탭 이동을 걸어두면 흐름이 끊긴다.
 */
@Component({
  selector: 'app-space-detail',
  imports: [PageHeader, IntroDialog, MapLinks, StampBadge, RouterLink, ScrollTopDirective],
  templateUrl: './space-detail.html',
  styleUrl: './space-detail.scss',
})
export class SpaceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private spaces = inject(SpaceService);
  private photos = inject(PhotoService);

  /** 진입 모션 게이트 — .is-ready 가 붙은 뒤 자식 motion-* 이 재생된다. */
  protected readonly ready = signal(false);
  protected readonly loadState = signal<LoadState>('idle');
  protected readonly introOpen = signal(false);

  private readonly slug = signal('');

  protected readonly spaceVisit = computed(() => this.spaces.findVisitBySlug(this.slug()));
  protected readonly isVisited = computed(() => this.spaceVisit()?.visit != null);

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

  /** 목록에서 들어온 경우가 대부분이라 히스토리를 되돌린다. 진입 기록이 없으면 목록으로 보낸다 */
  protected goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/spaces']);
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
