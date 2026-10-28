import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
  templateUrl: './account.page.html',
})
export class AccountPage {
  readonly currentUser = inject(AuthService).currentUser;
}
