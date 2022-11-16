/*!
 * @license
 * Alfresco Example Content Application
 *
 * Copyright (C) 2005 - 2020 Alfresco Software Limited
 *
 * This file is part of the Alfresco Example Content Application.
 * If the software was purchased under a paid Alfresco license, the terms of
 * the paid license agreement will prevail.  Otherwise, the software is
 * provided under the following open source license terms:
 *
 * The Alfresco Example Content Application is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Alfresco Example Content Application is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

import { AppConfigService, SidenavLayoutComponent, UserPreferencesService } from '@alfresco/adf-core';
import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { filter, takeUntil, map, withLatestFrom } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Directionality } from '@angular/cdk/bidi';
import { SHELL_APP_SERVICE, ShellAppService } from '../../app-shell.module';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-shell' }
})
export class ShellLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('layout', { static: true })
  layout: SidenavLayoutComponent;

  onDestroy$: Subject<boolean> = new Subject<boolean>();
  isSmallScreen$: Observable<boolean>;

  expandedSidenav: boolean;
  minimizeSidenav = false;
  hideSidenav = false;
  direction: Directionality;

  constructor(
    private router: Router,
    private userPreferenceService: UserPreferencesService,
    private appConfigService: AppConfigService,
    private breakpointObserver: BreakpointObserver,
    @Inject(SHELL_APP_SERVICE) private shellService: ShellAppService
  ) {}

  ngOnInit() {
    this.shellService.init();
    this.isSmallScreen$ = this.breakpointObserver.observe(['(max-width: 600px)']).pipe(map((result) => result.matches));

    this.hideSidenav = this.shellService.hideSidenavConditions.some((el) => this.router.routerState.snapshot.url.includes(el));
    this.minimizeSidenav = this.shellService.minimizeSidenavConditions.some((el) => this.router.routerState.snapshot.url.includes(el));

    if (!this.minimizeSidenav) {
      this.expandedSidenav = this.getSidenavState();
    } else {
      this.expandedSidenav = false;
    }

    this.router.events
      .pipe(
        withLatestFrom(this.isSmallScreen$),
        filter(([event, isSmallScreen]) => isSmallScreen && event instanceof NavigationEnd),
        takeUntil(this.onDestroy$)
      )
      .subscribe(() => {
        this.layout.container.sidenav.close();
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.onDestroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.minimizeSidenav = this.shellService.minimizeSidenavConditions.some((el) => event.urlAfterRedirects.includes(el));
        this.hideSidenav = this.shellService.hideSidenavConditions.some((el) => event.urlAfterRedirects.includes(el));

        this.updateState();
      });
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

  hideMenu(event: Event) {
    if (this.layout.container.isMobileScreenSize) {
      event.preventDefault();
      this.layout.container.toggleMenu();
    }
  }

  private updateState() {
    if (this.minimizeSidenav && !this.layout.isMenuMinimized) {
      this.layout.isMenuMinimized = true;
      if (!this.layout.container.isMobileScreenSize) {
        this.layout.container.toggleMenu();
      }
    }

    if (!this.minimizeSidenav) {
      if (this.getSidenavState() && this.layout.isMenuMinimized) {
        this.layout.isMenuMinimized = false;
        this.layout.container.toggleMenu();
      }
    }
  }

  onExpanded(state: boolean) {
    if (!this.minimizeSidenav && this.appConfigService.get('sideNav.preserveState')) {
      this.userPreferenceService.set('expandedSidenav', state);
    }
  }

  private getSidenavState(): boolean {
    const expand = this.appConfigService.get<boolean>('sideNav.expandedSidenav', true);
    const preserveState = this.appConfigService.get<boolean>('sideNav.preserveState', true);

    if (preserveState) {
      return this.userPreferenceService.get('expandedSidenav', expand.toString()) === 'true';
    }

    return expand;
  }
}
