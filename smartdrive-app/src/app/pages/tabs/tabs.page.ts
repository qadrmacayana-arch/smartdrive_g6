import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonMenuButton } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonMenuButton],
  styleUrl: './tabs.page.scss',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-menu-button
          class="menu-tab-button"
          menu="main-menu"
          menuIcon="menu-outline"
          auto-hide="false"
          aria-label="Open navigation menu"
        ></ion-menu-button>
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="rent-a-car" href="/tabs/rent-a-car">
          <ion-icon name="car-outline"></ion-icon>
          <ion-label>Rent a Car</ion-label>
        </ion-tab-button>
        @if (currentUser()) {
          <ion-tab-button tab="about" href="/tabs/about">
            <ion-icon name="information-circle-outline"></ion-icon>
            <ion-label>About</ion-label>
          </ion-tab-button>
        }
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  readonly currentUser = this.auth.currentUser;

  constructor(private readonly auth: AuthService) {}
}
