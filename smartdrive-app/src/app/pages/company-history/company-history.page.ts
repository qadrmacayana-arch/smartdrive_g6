import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';

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
  selector: 'app-company-history',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
  templateUrl: './company-history.page.html',
  styleUrl: './company-history.page.scss',
})
export class CompanyHistoryPage {
  readonly members = COMPANY_MEMBERS;
}
