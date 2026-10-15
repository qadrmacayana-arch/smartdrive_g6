import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonIcon,
  IonButton,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

interface CompanyMember {
  name: string;
  role: string;
}

const COMPANY_MEMBERS: CompanyMember[] = [
  { name: 'Anthony Macayana', role: 'Main developer, designer, and planner' },
  { name: 'James Miuel Faa', role: 'Design lead for the Ionic Angular, web, and mobile versions' },
  { name: 'Joseph P.J. Abus', role: 'Backend developer and designer' },
  { name: 'King Aron Noriega', role: 'Backend, API, and database developer' },
  { name: 'Sean Audrey Ferrer', role: 'Backend and database developer' },
  { name: 'Shanice Kyle Dacian', role: 'Frontend and API developer' },
];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon, IonButton],
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss',
})
export class AboutPage {
  readonly currentUser = this.auth.currentUser;
  readonly activeTab = signal<'history' | 'contact' | 'developers'>('history');
  readonly members = COMPANY_MEMBERS;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
  ) {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const section = params.get('section');
      this.activeTab.set(
        section === 'contact' || section === 'developers' ? section : 'history',
      );
    });
  }

  browseFleet(): void {
    this.router.navigateByUrl('/tabs/rent-a-car');
  }

  selectTab(tab: 'history' | 'contact' | 'developers'): void {
    this.activeTab.set(tab);
  }
}
