import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
} from '@ionic/angular';
import { VehicleService } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { Vehicle } from '../../core/models/vehicle.model';

interface WikimediaVehicleImage {
  thumbnail: string;
  filePage: string;
  fileName: string;
  artist: string;
  license: string;
}

interface WikimediaFilePage {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string } | undefined>;
  }>;
}

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
  ],
  templateUrl: './vehicle-detail.page.html',
  styleUrl: './vehicle-detail.page.scss',
})
export class VehicleDetailPage implements OnInit {
  readonly vehicle = signal<Vehicle | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly bookingCheckLoading = signal(false);
  readonly alreadyRented = signal(false);
  readonly onlineImages = signal<WikimediaVehicleImage[]>([]);
  readonly onlineImagesLoading = signal(false);
  readonly onlineImagesError = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly vehicleService: VehicleService,
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const vehicle = await this.vehicleService.getById(id);
      if (!vehicle) {
        this.errorMessage.set('This vehicle could not be found.');
      } else {
        this.vehicle.set(vehicle);
        void this.loadOnlineImages(vehicle);
        const user = this.auth.currentUser();
        if (user) {
          this.alreadyRented.set(await this.bookingService.hasOngoingBooking(user.id, vehicle.id));
        }
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load this vehicle.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadOnlineImages(vehicle: Vehicle): Promise<void> {
    this.onlineImagesLoading.set(true);
    this.onlineImagesError.set(false);
    try {
      const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: `"${vehicle.name}" ${vehicle.main_category === 'Motorcycles' ? 'motorcycle' : 'car'}`,
        gsrnamespace: '6',
        gsrlimit: '12',
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: '900',
        format: 'json',
        origin: '*',
      });
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        credentials: 'omit',
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error(`Wikimedia Commons returned HTTP ${response.status}.`);

      const payload: unknown = await response.json();
      if (!this.isRecord(payload)) throw new Error('Wikimedia Commons returned an invalid response.');
      const query = payload['query'];
      if (!this.isRecord(query) || !this.isRecord(query['pages'])) {
        this.onlineImages.set([]);
        return;
      }

      const modelTerms = this.normalizedWords(vehicle.name).filter((word) => word.length > 1);
      const requiredMatchingTerms = vehicle.main_category === 'Motorcycles'
        ? 1
        : modelTerms.length;
      const images = Object.values(query['pages'])
        .filter((page): page is WikimediaFilePage =>
          this.isRecord(page) && typeof page['title'] === 'string',
        )
        .map((page) => {
          const info = page.imageinfo?.[0];
          const metadata = info?.extmetadata ?? {};
          const searchableText = this.normalizeText([
            page.title,
            metadata['ObjectName']?.value,
            metadata['ImageDescription']?.value,
            metadata['Categories']?.value,
          ].filter(Boolean).join(' '));
          const matchingTerms = modelTerms.filter((term) => searchableText.includes(term)).length;
          const thumbnail = info?.thumburl;
          const filePage = info?.descriptionurl;
          if (!thumbnail || !filePage || matchingTerms < requiredMatchingTerms) return null;

          return {
            thumbnail,
            filePage,
            fileName: (page.title ?? vehicle.name).replace(/^File:/, ''),
            artist: this.plainText(metadata['Artist']?.value)
              || this.plainText(metadata['Credit']?.value)
              || 'Wikimedia Commons contributor',
            license: this.plainText(metadata['LicenseShortName']?.value) || 'See image page',
            matchingTerms,
          };
        })
        .filter((image): image is WikimediaVehicleImage & { matchingTerms: number } => image !== null)
        .sort((first, second) => second.matchingTerms - first.matchingTerms)
        .filter((image, index, all) =>
          all.findIndex((candidate) => candidate.thumbnail === image.thumbnail) === index,
        )
        .slice(0, 8)
        .map(({ matchingTerms: _matchingTerms, ...image }) => image);
      this.onlineImages.set(images);
    } catch (error) {
      this.onlineImagesError.set(true);
      console.error(`Unable to load online vehicle photos for ${vehicle.name}.`, error);
    } finally {
      this.onlineImagesLoading.set(false);
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private normalizedWords(value: string): string[] {
    return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/);
  }

  private normalizeText(value: string): string {
    return this.normalizedWords(
      new DOMParser().parseFromString(value, 'text/html').body.textContent ?? value,
    ).join(' ');
  }

  private plainText(value: string | undefined): string {
    if (!value) return '';
    return (new DOMParser().parseFromString(value, 'text/html').body.textContent ?? '').trim();
  }

  async bookNow(): Promise<void> {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.bookingCheckLoading.set(true);
    try {
      this.alreadyRented.set(await this.bookingService.hasOngoingBooking(user.id, vehicle.id));
      if (this.alreadyRented()) return;
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not verify your current bookings.');
      return;
    } finally {
      this.bookingCheckLoading.set(false);
    }

    this.router.navigate(['/booking', vehicle.id, 'dates'], {
      queryParams: {
        location: this.route.snapshot.queryParamMap.get('location'),
        date: this.route.snapshot.queryParamMap.get('date'),
      },
    });
  }

  getVehicleDescription(vehicle: Vehicle): string {
    return vehicle.description?.trim() || `Enjoy a comfortable ${vehicle.type.toLowerCase()} experience with the ${vehicle.name}. This vehicle seats ${vehicle.seats} ${vehicle.seats === 1 ? 'passenger' : 'passengers'} and is ready for your next trip.`;
  }

  getVehicleFeatures(vehicle: Vehicle): string[] {
    const features = Array.isArray(vehicle.features)
      ? vehicle.features.filter((feature): feature is string => typeof feature === 'string' && feature.trim().length > 0)
      : [];

    if (features.length) return features;

    return [
      `${vehicle.seats}-seat interior`,
      `${vehicle.transmission} transmission`,
      `${vehicle.fuel} power`,
      'Air conditioning',
      'Clean and well maintained',
      'Flexible rental support',
    ];
  }
}
