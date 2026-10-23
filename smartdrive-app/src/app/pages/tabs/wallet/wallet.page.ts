import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletBalance, WalletTransaction } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
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

  constructor(
    private readonly auth: AuthService,
    private readonly walletService: WalletService,
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

  iconFor(type: WalletTransaction['type']): string {
    switch (type) {
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
