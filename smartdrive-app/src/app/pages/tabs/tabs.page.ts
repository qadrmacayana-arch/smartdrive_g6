import { Component } from '@angular/core';
import { IonTabs } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs],
  template: '<ion-tabs></ion-tabs>',
})
export class TabsPage {}
