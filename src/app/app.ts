import { Component, isDevMode } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { DevScenario } from './shared/dev-scenario/dev-scenario';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DevScenario],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** 방문 시나리오 도구 — mock 으로 도는 개발 빌드에서만 띄운다 */
  protected readonly showDevTools = isDevMode() && environment.useMockApi;
}
