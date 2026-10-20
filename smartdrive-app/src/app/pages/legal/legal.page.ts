import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonToolbar } from '@ionic/angular';
import { LegalDocumentComponent, type LegalDocumentType } from './legal-document.component';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, LegalDocumentComponent],
  templateUrl: './legal.page.html',
  styleUrl: './legal.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPage {
  readonly documentType: LegalDocumentType;

  constructor(route: ActivatedRoute) {
    this.documentType = route.snapshot.data['document'] === 'privacy' ? 'privacy' : 'terms';
  }
}
