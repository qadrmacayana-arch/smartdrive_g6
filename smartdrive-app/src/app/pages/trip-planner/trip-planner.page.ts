import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { MobileFeedbackService } from '../../core/services/mobile-feedback.service';

interface TripStop {
  name: string;
  description: string;
}

interface TripDay {
  title: string;
  stops: TripStop[];
}

interface TripDestination {
  id: string;
  name: string;
  region: string;
  introduction: string;
  days: TripDay[];
}

interface WikimediaImage {
  thumbnail: string;
  original: string;
  filePage: string;
  fileName: string;
  artist: string;
  license: string;
}

type PlacePhotoState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; image: WikimediaImage };

interface WikimediaPage {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string } | undefined>;
  }>;
}

const TRIP_DESTINATIONS: TripDestination[] = [
  {
    id: 'tagaytay',
    name: 'Tagaytay',
    region: 'Cavite',
    introduction: 'Cool-weather viewpoints, local favorites, and an easy change of pace.',
    days: [
      {
        title: 'Views & fresh air',
        stops: [
          { name: "People's Park in the Sky", description: 'Take in sweeping views from one of Tagaytay’s best-known high points.' },
          { name: 'Picnic Grove', description: 'Stretch your legs among the gardens and overlook the Taal landscape.' },
        ],
      },
      {
        title: 'Art & a little fun',
        stops: [
          { name: 'Museo Orlina', description: 'Explore contemporary glass sculpture and its art-filled galleries.' },
          { name: 'Sky Ranch Tagaytay', description: 'Wrap up the day with rides and views along the ridge.' },
        ],
      },
      {
        title: 'Market & garden stops',
        stops: [
          { name: 'Mahogany Market', description: 'Browse the local market and try a Tagaytay bulalo favorite.' },
          { name: "Sonya's Garden", description: 'Slow down over a garden meal in nearby Alfonso.' },
        ],
      },
    ],
  },
  {
    id: 'baguio',
    name: 'Baguio',
    region: 'Benguet',
    introduction: 'Pine-scented walks, creative corners, and classic city landmarks.',
    days: [
      {
        title: 'City stroll',
        stops: [
          { name: 'Burnham Park', description: 'Start with a relaxed walk or a paddle around the park.' },
          { name: 'Session Road', description: 'Explore the city’s central shops, cafés, and restaurants.' },
        ],
      },
      {
        title: 'Gardens & heritage',
        stops: [
          { name: 'Baguio Botanical Garden', description: 'Wander among native plants and cultural displays.' },
          { name: 'Wright Park', description: 'Take the scenic steps beside the park’s long reflecting pool.' },
        ],
      },
      {
        title: 'Art & local craft',
        stops: [
          { name: 'BenCab Museum', description: 'See contemporary and indigenous Filipino art in a hillside setting.' },
          { name: 'Tam-awan Village', description: 'Discover Cordillera-inspired art and traditional architecture.' },
        ],
      },
    ],
  },
  {
    id: 'la-union',
    name: 'La Union',
    region: 'La Union',
    introduction: 'Surf-town energy, coastal views, and laid-back northern Luzon stops.',
    days: [
      {
        title: 'Surf-town day',
        stops: [
          { name: 'Urbiztondo Beach, San Juan', description: 'Enjoy the shore and watch the surf at this popular coastal stretch.' },
          { name: 'San Juan town center', description: 'Take your pick of nearby cafés and casual local eats.' },
        ],
      },
      {
        title: 'Coast & countryside',
        stops: [
          { name: 'Bauang grape farms', description: 'Visit a local grape-growing area; check farm schedules before setting out.' },
          { name: 'Poro Point Lighthouse', description: 'Take in sea views from the headland near San Fernando.' },
        ],
      },
      {
        title: 'A day in nature',
        stops: [
          { name: 'Tangadan Falls', description: 'Make time for a guided nature visit near San Gabriel; check access conditions first.' },
          { name: 'San Juan seafront', description: 'Return to the coast for sunset and a relaxed end to the day.' },
        ],
      },
    ],
  },
  {
    id: 'cebu-city',
    name: 'Cebu City',
    region: 'Cebu',
    introduction: 'A mix of historic landmarks, city flavors, and hillside views.',
    days: [
      {
        title: 'Cebu’s historic heart',
        stops: [
          { name: 'Basilica Minore del Santo Niño', description: 'Visit one of Cebu’s most significant historic churches.' },
          { name: 'Fort San Pedro', description: 'Explore the compact Spanish-era fort by the waterfront.' },
        ],
      },
      {
        title: 'Heritage & local life',
        stops: [
          { name: 'Museo Sugbo', description: 'Learn about Cebu’s history inside a former provincial jail.' },
          { name: 'Yap-Sandiego Ancestral House', description: 'Step inside one of the city’s oldest preserved homes.' },
        ],
      },
      {
        title: 'Views above the city',
        stops: [
          { name: 'Temple of Leah', description: 'See the grand hilltop landmark and its sweeping views.' },
          { name: 'Tops Lookout', description: 'Finish above the city with a panoramic evening view.' },
        ],
      },
    ],
  },
  {
    id: 'manila',
    name: 'Manila',
    region: 'Metro Manila',
    introduction: 'Historic walled streets, leafy city parks, museums, and neighborhood food.',
    days: [
      { title: 'Old Manila', stops: [
        { name: 'Intramuros', description: 'Walk the historic walled city and its restored colonial-era streets.' },
        { name: 'Fort Santiago', description: 'Explore the historic citadel and its gardens inside Intramuros.' },
      ] },
      { title: 'Museums & monuments', stops: [
        { name: 'National Museum of Fine Arts', description: 'See Filipino artworks in the museum district.' },
        { name: 'Rizal Park', description: 'Take a relaxing walk through the country’s historic urban park.' },
      ] },
      { title: 'Chinatown flavors', stops: [
        { name: 'Binondo', description: 'Explore the neighborhood’s food spots and historic streets.' },
        { name: 'Manila Baywalk', description: 'End the day with a stroll along the bayfront.' },
      ] },
    ],
  },
  {
    id: 'vigan',
    name: 'Vigan',
    region: 'Ilocos Sur',
    introduction: 'A heritage-city escape filled with cobblestone streets, old houses, and local crafts.',
    days: [
      { title: 'Heritage streets', stops: [
        { name: 'Calle Crisologo', description: 'Wander the city’s famous cobblestone heritage street.' },
        { name: 'Plaza Salcedo', description: 'See the central plaza and its historic surroundings.' },
      ] },
      { title: 'City landmarks', stops: [
        { name: 'Vigan Cathedral', description: 'Visit the historic cathedral beside the central plaza.' },
        { name: 'Bantay Church Bell Tower', description: 'See the landmark bell tower just outside the city center.' },
      ] },
      { title: 'Local crafts & culture', stops: [
        { name: 'Pagburnayan Jar Factory', description: 'See the local pottery-making tradition up close.' },
        { name: 'Baluarte Resort and Mini Zoo', description: 'Visit the family-friendly animal and garden attraction.' },
      ] },
    ],
  },
  {
    id: 'batangas',
    name: 'Batangas',
    region: 'Calabarzon',
    introduction: 'Heritage-town charm, beach time, and scenic day trips in one province.',
    days: [
      { title: 'Taal heritage', stops: [
        { name: 'Taal Basilica', description: 'Visit the landmark basilica in the heritage town of Taal.' },
        { name: 'Taal Heritage Town', description: 'Explore preserved ancestral homes and the historic town center.' },
      ] },
      { title: 'Coast & clear water', stops: [
        { name: 'Anilao, Batangas', description: 'Enjoy the coastal scenery and well-known diving area.' },
        { name: 'Laiya Beach', description: 'Spend a relaxed afternoon by the shoreline in San Juan.' },
      ] },
      { title: 'Mountain & countryside', stops: [
        { name: 'Mount Maculot', description: 'Take in the mountain scenery; check trail conditions before hiking.' },
        { name: 'Fantasy World, Batangas', description: 'Stop by the colorful castle-inspired attraction in Lemery.' },
      ] },
    ],
  },
  {
    id: 'boracay',
    name: 'Boracay',
    region: 'Aklan',
    introduction: 'Island beaches, a breezy shoreline, and easygoing sunset stops.',
    days: [
      { title: 'White Beach day', stops: [
        { name: 'White Beach, Boracay', description: 'Enjoy the island’s best-known stretch of white sand.' },
        { name: "D'Mall Boracay", description: 'Browse the central shops and nearby places to eat.' },
      ] },
      { title: 'Island coastline', stops: [
        { name: 'Puka Shell Beach', description: 'Relax on a quieter beach at the island’s northern end.' },
        { name: 'Diniwid Beach', description: 'Find a smaller cove and take in the coastal view.' },
      ] },
      { title: 'Sunset & sea breeze', stops: [
        { name: "Willy's Rock, Boracay", description: 'See the island landmark from the White Beach shoreline.' },
        { name: 'Bulabog Beach', description: 'Visit the breezy eastern coast and its watersports area.' },
      ] },
    ],
  },
  {
    id: 'bohol',
    name: 'Bohol',
    region: 'Central Visayas',
    introduction: 'Countryside views, river scenery, island beaches, and cultural landmarks.',
    days: [
      { title: 'Bohol countryside', stops: [
        { name: 'Chocolate Hills', description: 'See Bohol’s famous rolling hills from a designated viewpoint.' },
        { name: 'Philippine Tarsier Sanctuary', description: 'Learn about the small primates at a conservation center.' },
      ] },
      { title: 'River & heritage', stops: [
        { name: 'Loboc River', description: 'Take in the lush riverside scenery near Loboc.' },
        { name: 'Baclayon Church', description: 'Visit one of the province’s historic stone churches.' },
      ] },
      { title: 'Panglao coast', stops: [
        { name: 'Alona Beach', description: 'Spend a laid-back afternoon along Panglao’s popular beach.' },
        { name: 'Dumaluan Beach', description: 'Enjoy another stretch of Panglao sand and seaside views.' },
      ] },
    ],
  },
  {
    id: 'puerto-princesa',
    name: 'Puerto Princesa',
    region: 'Palawan',
    introduction: 'A nature-focused getaway with bay views, local favorites, and a world-famous river.',
    days: [
      { title: 'Underground River', stops: [
        { name: 'Puerto Princesa Subterranean River National Park', description: 'Plan ahead for the protected park and its guided river tour.' },
        { name: 'Sabang Beach, Palawan', description: 'Unwind by the coast after exploring the national park.' },
      ] },
      { title: 'Island & bay views', stops: [
        { name: 'Honda Bay', description: 'Explore the bay and check local island tour schedules.' },
        { name: 'Puerto Princesa City Baywalk Park', description: 'Take an easy walk along the city’s waterfront.' },
      ] },
      { title: 'Local discoveries', stops: [
        { name: "Baker's Hill", description: 'Visit a landscaped local attraction with snacks and garden views.' },
        { name: "Mitra's Ranch", description: 'Enjoy an elevated view across Puerto Princesa.' },
      ] },
    ],
  },
  {
    id: 'davao',
    name: 'Davao City',
    region: 'Davao Region',
    introduction: 'Green city parks, wildlife conservation, and a taste of Mindanao.',
    days: [
      { title: 'Wildlife & nature', stops: [
        { name: 'Philippine Eagle Center', description: 'Learn about conservation of the Philippine eagle.' },
        { name: 'Eden Nature Park', description: 'Explore cool mountain gardens outside the city center.' },
      ] },
      { title: 'City favorites', stops: [
        { name: "People's Park, Davao City", description: 'Take a break in the heart of the city among its sculptures and gardens.' },
        { name: 'Davao Crocodile Park', description: 'Visit the local wildlife park and its animal exhibits.' },
      ] },
      { title: 'Evening in the city', stops: [
        { name: 'Roxas Night Market', description: 'Sample local street food and browse the evening stalls.' },
        { name: "Jack’s Ridge, Davao City", description: 'Catch a hillside view over the city after dark.' },
      ] },
    ],
  },
  {
    id: 'siargao',
    name: 'Siargao',
    region: 'Surigao del Norte',
    introduction: 'Surf-town mornings, natural pools, and island-hopping scenery.',
    days: [
      { title: 'Surf & island life', stops: [
        { name: 'Cloud 9, Siargao', description: 'See the island’s iconic surf break and boardwalk.' },
        { name: 'General Luna, Siargao', description: 'Explore the island’s lively town center and cafés.' },
      ] },
      { title: 'Rock pools & lagoon', stops: [
        { name: 'Magpupungko Rock Pools', description: 'Visit the tidal pools at low tide; check tide times before driving.' },
        { name: 'Sugba Lagoon', description: 'Plan ahead for boat access to the scenic lagoon.' },
      ] },
      { title: 'Island hopping', stops: [
        { name: 'Guyam Island', description: 'Stop at the tiny palm-lined island near General Luna.' },
        { name: 'Daku Island', description: 'Relax at the larger island and check local boat schedules.' },
      ] },
    ],
  },
];

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonDatetime,
    IonIcon,
  ],
  templateUrl: './trip-planner.page.html',
  styleUrl: './trip-planner.page.scss',
})
export class TripPlannerPage {
  private readonly mobileFeedback = inject(MobileFeedbackService);
  readonly destinations = TRIP_DESTINATIONS;
  readonly destinationSearch = signal('');
  readonly suggestionsVisible = signal(false);
  readonly selectedDestinationId = signal<string | null>(null);
  readonly selectedDestination = computed(
    () => this.destinations.find((destination) => destination.id === this.selectedDestinationId()) ?? null,
  );
  readonly matchingDestinations = computed(() => {
    const query = this.destinationSearch().trim().toLowerCase();
    return this.destinations
      .filter((destination) => {
        if (!query) return true;
        const searchableText = [
          destination.name,
          destination.region,
          ...destination.days.flatMap((day) => day.stops.map((stop) => stop.name)),
        ].join(' ').toLowerCase();
        return searchableText.includes(query);
      })
      .slice(0, 8);
  });
  readonly numberOfDays = signal(1);
  readonly startingPoint = signal('');
  readonly minimumTripDate = this.getToday();
  readonly tripStartDate = signal(this.minimumTripDate);
  readonly planCreated = signal(false);
  readonly photoStates = signal<Record<string, PlacePhotoState>>({});
  readonly selectedImage = signal<WikimediaImage | null>(null);
  private photoRequest = 0;

  selectDestination(destination: TripDestination): void {
    this.selectedDestinationId.set(destination.id);
    this.destinationSearch.set(`${destination.name}, ${destination.region}`);
    this.suggestionsVisible.set(false);
    this.planCreated.set(false);
    this.photoRequest++;
    this.photoStates.set({});
  }

  updateDestinationSearch(query: string): void {
    this.destinationSearch.set(query);
    this.suggestionsVisible.set(true);
    const selected = this.selectedDestination();
    if (selected && !`${selected.name}, ${selected.region}`.toLowerCase().includes(query.trim().toLowerCase())) {
      this.selectedDestinationId.set(null);
      this.planCreated.set(false);
      this.photoRequest++;
      this.photoStates.set({});
    }
  }

  updateTripStartDate(event: CustomEvent<{ value?: string | string[] | null }>): void {
    const value = event.detail.value;
    if (typeof value !== 'string') return;
    const date = value.slice(0, 10);
    if (this.isValidDate(date) && date >= this.getToday()) this.tripStartDate.set(date);
  }

  async createPlan(): Promise<void> {
    const destination = this.selectedDestination();
    if (!destination) {
      this.suggestionsVisible.set(true);
      return;
    }
    this.planCreated.set(true);
    this.selectedImage.set(null);
    this.photoStates.set(Object.fromEntries(
      destination.days.slice(0, this.numberOfDays()).flatMap((day) =>
        day.stops.map((stop) => [this.getPhotoKey(destination, stop), { status: 'loading' } as PlacePhotoState]),
      ),
    ));
    const request = ++this.photoRequest;
    this.mobileFeedback.success();
    await this.loadStopImages(destination, request);
  }

  deletePlan(): void {
    this.photoRequest++;
    this.planCreated.set(false);
    this.photoStates.set({});
    this.selectedImage.set(null);
    this.mobileFeedback.lightImpact();
  }

  getPhotoState(stop: TripStop): PlacePhotoState | undefined {
    const destination = this.selectedDestination();
    return destination ? this.photoStates()[this.getPhotoKey(destination, stop)] : undefined;
  }

  openPhoto(stop: TripStop): void {
    const state = this.getPhotoState(stop);
    if (state?.status === 'loaded') this.selectedImage.set(state.image);
  }

  onPhotoError(stop: TripStop): void {
    const destination = this.selectedDestination();
    if (!destination) return;
    const key = this.getPhotoKey(destination, stop);
    this.photoStates.update((states) => ({ ...states, [key]: { status: 'error' } }));
    console.error(`The Wikimedia Commons photo for ${stop.name} could not be displayed.`);
  }

  getDateLabel(dayIndex: number): string {
    const [year, month, day] = this.tripStartDate().split('-').map(Number);
    const date = new Date(year, month - 1, day + dayIndex);
    return new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  }

  getMapsUrl(dayIndex: number): string {
    const selected = this.selectedDestination();
    if (!selected) return 'https://www.google.com/maps';
    const days = selected.days.slice(0, this.numberOfDays());
    const day = days[dayIndex];
    const previousDay = days[dayIndex - 1];
    const origin = dayIndex === 0
      ? this.startingPoint().trim() || selected.name
      : previousDay.stops[previousDay.stops.length - 1].name;
    const destination = day.stops[day.stops.length - 1].name;
    const params = new URLSearchParams({
      api: '1',
      origin,
      destination,
      waypoints: day.stops.slice(0, -1).map((stop) => stop.name).join('|'),
      travelmode: 'driving',
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  private async loadStopImages(destination: TripDestination, request: number): Promise<void> {
    const stops = destination.days.slice(0, this.numberOfDays()).flatMap((day) => day.stops);
    for (const stop of stops) {
      if (request !== this.photoRequest) return;
      try {
        const image = await this.searchCommonsImage(stop, destination);
        if (request !== this.photoRequest) return;
        const key = this.getPhotoKey(destination, stop);
        if (image) {
          this.photoStates.update((states) => ({ ...states, [key]: { status: 'loaded', image } }));
        } else {
          this.photoStates.update((states) => ({ ...states, [key]: { status: 'error' } }));
          console.warn(`No Wikimedia Commons photo was found for ${stop.name}.`);
        }
      } catch (error) {
        if (request !== this.photoRequest) return;
        const key = this.getPhotoKey(destination, stop);
        this.photoStates.update((states) => ({ ...states, [key]: { status: 'error' } }));
        console.error(`Unable to load a Wikimedia Commons photo for ${stop.name}.`, error);
      }
    }
  }

  private async searchCommonsImage(stop: TripStop, destination: TripDestination): Promise<WikimediaImage | null> {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `"${stop.name}" ${destination.name} ${destination.region}`,
      gsrnamespace: '6',
      gsrlimit: '5',
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
    const queryResult = payload['query'];
    if (!this.isRecord(queryResult) || !this.isRecord(queryResult['pages'])) return null;

    const pages = Object.values(queryResult['pages'])
      .filter((page): page is WikimediaPage => this.isRecord(page) && typeof page['title'] === 'string')
      .sort((first, second) => this.scoreImageTitle(second.title ?? '', stop.name) - this.scoreImageTitle(first.title ?? '', stop.name));
    for (const page of pages) {
      if (this.scoreImageTitle(page.title ?? '', stop.name) === 0) continue;
      const imageInfo = page.imageinfo?.[0];
      const thumbnail = imageInfo?.thumburl;
      const original = imageInfo?.url;
      const filePage = imageInfo?.descriptionurl;
      if (!thumbnail || !original || !filePage) continue;

      const metadata = imageInfo.extmetadata ?? {};
      const artist = this.plainText(metadata['Artist']?.value)
        || this.plainText(metadata['Credit']?.value)
        || 'Wikimedia Commons contributor';
      const license = this.plainText(metadata['LicenseShortName']?.value) || 'See image page';
      return {
        thumbnail,
        original,
        filePage,
        fileName: (page.title ?? stop.name).replace(/^File:/, ''),
        artist,
        license,
      };
    }
    return null;
  }

  private scoreImageTitle(title: string, placeName: string): number {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedTitle = normalize(title);
    const words = normalize(placeName).split(/\s+/).filter((word) => word.length > 2);
    return words.reduce((score, word) => score + (normalizedTitle.includes(word) ? 1 : 0), 0);
  }

  private plainText(value: string | undefined): string {
    if (!value) return '';
    return (new DOMParser().parseFromString(value, 'text/html').body.textContent ?? '').trim();
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getPhotoKey(destination: TripDestination, stop: TripStop): string {
    return `${destination.id}:${stop.name}`;
  }

  private getToday(): string {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
}
