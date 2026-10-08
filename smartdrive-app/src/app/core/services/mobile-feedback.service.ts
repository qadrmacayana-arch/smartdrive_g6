import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ImpactStyle, Haptics, NotificationType } from '@capacitor/haptics';

@Injectable({ providedIn: 'root' })
export class MobileFeedbackService {
  selection(): void {
    this.run(() => Haptics.impact({ style: ImpactStyle.Light }));
  }

  lightImpact(): void {
    this.selection();
  }

  mediumImpact(): void {
    this.run(() => Haptics.impact({ style: ImpactStyle.Medium }));
  }

  success(): void {
    this.run(() => Haptics.notification({ type: NotificationType.Success }));
  }

  private run(feedback: () => Promise<void>): void {
    if (!Capacitor.isNativePlatform()) return;

    void feedback().catch((error: unknown) => {
      console.error('Unable to provide haptic feedback.', error);
    });
  }
}
