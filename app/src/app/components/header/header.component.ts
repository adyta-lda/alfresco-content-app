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

import { Component, ViewEncapsulation, Output, EventEmitter, OnInit, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { ContentActionRef } from '@alfresco/adf-extensions';
import { AppStore, getHeaderColor, getAppName, getLogoPath, getHeaderImagePath, getHeaderTextColor } from '@alfresco/aca-shared/store';
import { AppExtensionService } from '@alfresco/aca-shared';
import { takeUntil } from 'rxjs/operators';
import { AppConfigService } from '@alfresco/adf-core';
import { isContentServiceEnabled } from '@alfresco/aca-shared/rules';
import { ContentUrlService } from '../../services/content-url.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-header' }
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  searchBarExpanded = false;
  showSearchBar = true;
  actions=[];
  private onDestroy$: Subject<boolean> = new Subject<boolean>();
  @Output()
  toggleClicked = new EventEmitter();

  @Input() expandedSidenav = true;

  appName$: Observable<string>;
  headerColor$: Observable<any>;
  headerTextColor$: Observable<string>;
  logo$: Observable<string>;
  pageName;
  landingPage: string;
  buttonList;

  // actions: Array<ContentActionRef> = [];

  constructor(store: Store<AppStore>, private appExtensions: AppExtensionService, 
    private contentservce: ContentUrlService, private appConfigService: AppConfigService, private route: Router) {
    this.headerColor$ = store.select(getHeaderColor);
    this.headerTextColor$ = store.select(getHeaderTextColor);
    this.appName$ = store.select(getAppName);
    this.logo$ = store.select(getLogoPath);
    this.landingPage = this.appConfigService.get('landingPage', '/personal-files');

    store.select(getHeaderImagePath).subscribe((path) => {
      document.body.style.setProperty('--header-background-image', `url('${path}')`);
    });
  }
  runAction() {
    return false;
    // this.store.dispatch({ type });
  }
  ngOnInit() {
    console.log("routeee", this.route.url);
    this.contentservce.sendSidePageName.subscribe(data => {
      console.log("pagggg", data.pageName);
      this.pageName = data.pageName;
    });
    if (this.route.url == "/personal-files" || this.route.url == "/") {
      this.pageName = 'APP.BROWSE.PERSONAL.SIDENAV_LINK.LABEL';
    }
    this.appExtensions
      .getHeaderActions()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((actions) => {
        this.actions = actions;
      });

      this.buttonList = this.appConfigService.get('actions-list');
      console.log("button", this.buttonList);

    this.headerTextColor$.subscribe((color) => {
      document.documentElement.style.setProperty('--adf-header-text-color', color);
    });
  }

  isContentServiceEnabled(): boolean {
    return isContentServiceEnabled();
  }
  isSearchBarExpanded(value) {
    this.searchBarExpanded = value;
  }
  get isSmallScreen(): boolean {
    return false;
    // return this.layoutService.isSmallScreenWidth();
  }


  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

  trackByActionId(_: number, action: ContentActionRef) {
    return action.id;
  }
}
