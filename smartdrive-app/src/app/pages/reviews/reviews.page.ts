import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonTextarea,
  IonButton,
  IonSpinner,
  ToastController,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService } from '../../core/services/review.service';
import { Review } from '../../core/models/review.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonTextarea,
    IonButton,
    IonSpinner,
  ],
  templateUrl: './reviews.page.html',
  styleUrl: './reviews.page.scss',
})
export class ReviewsPage implements OnInit {
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly rating = signal(5);
  readonly comment = signal('');
  readonly submitting = signal(false);

  readonly currentUser = this.auth.currentUser;
  readonly ratingOptions = [
    { value: 1, emoji: '😞', label: 'Poor' },
    { value: 2, emoji: '🙁', label: 'Fair' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '😍', label: 'Great' },
  ];

  constructor(
    private readonly auth: AuthService,
    private readonly reviewService: ReviewService,
    private readonly toastCtrl: ToastController,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  ratingEmoji(value: number): string {
    return this.ratingOptions.find((option) => option.value === value)?.emoji ?? '😐';
  }

  ratingLabel(value: number): string {
    return this.ratingOptions.find((option) => option.value === value)?.label ?? 'Okay';
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.reviews.set(await this.reviewService.listRecent());
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    const user = this.currentUser();
    if (!user || !this.comment().trim()) return;

    this.submitting.set(true);
    try {
      await this.reviewService.submit({
        user_id: user.id,
        booking_id: null,
        customer_email: user.email,
        customer_name: user.fullName,
        rating: this.rating(),
        comment: this.comment().trim(),
      });
      this.comment.set('');
      this.rating.set(5);
      await this.load();
      const toast = await this.toastCtrl.create({
        message: 'Thanks for your feedback!',
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: error instanceof Error ? error.message : 'Unable to submit your review.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    } finally {
      this.submitting.set(false);
    }
  }
}
