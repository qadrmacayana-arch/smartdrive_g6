import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonButton,
  IonModal,
  IonItem,
  IonInput,
  IonSpinner,
  ToastController,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletBalance, WalletTransaction } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonButton,
    IonModal,
    IonItem,
    IonInput,
    IonSpinner,
  ],
  templateUrl: './wallet.page.html',
  styleUrl: './wallet.page.scss',
})
export class WalletPage implements OnInit {
  readonly currentUser = this.auth.currentUser;
  readonly balance = signal<WalletBalance | null>(null);
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly topUpOpen = signal(false);
  readonly topUpAmount = signal<number | null>(null);
  readonly topUpMethod = signal('gcash');
  readonly topUpSubmitting = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly walletService: WalletService,
    private readonly toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [balance, transactions] = await Promise.all([
        this.walletService.getOrCreateBalance(user.id, user.email),
        this.walletService.getTransactions(user.id),
      ]);
      this.balance.set(balance);
      this.transactions.set(transactions);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load your wallet.');
    } finally {
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    }
  }

  openTopUp(): void {
    this.topUpAmount.set(null);
    this.topUpOpen.set(true);
  }

  async confirmTopUp(): Promise<void> {
    const user = this.auth.currentUser();
    const amount = this.topUpAmount();
    if (!user || !amount || amount <= 0) return;

    this.topUpSubmitting.set(true);
    try {
      const updated = await this.walletService.topUp(user.id, user.email, amount, this.topUpMethod());
      this.balance.set(updated);
      this.transactions.set(await this.walletService.getTransactions(user.id));
      this.topUpOpen.set(false);
      const toast = await this.toastCtrl.create({
        message: `${amount.toLocaleString()} SR Points added to your wallet.`,
        duration: 2500,
        color: 'success',
        position: 'top',
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: error instanceof Error ? error.message : 'Top-up failed.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    } finally {
      this.topUpSubmitting.set(false);
    }
  }

  iconFor(type: WalletTransaction['type']): string {
    switch (type) {
      case 'top_up':
        return 'add-circle-outline';
      case 'reward':
        return 'gift-outline';
      case 'payment':
        return 'car-sport-outline';
      case 'refund':
        return 'trending-up-outline';
      default:
        return 'wallet-outline';
    }
  }
}
