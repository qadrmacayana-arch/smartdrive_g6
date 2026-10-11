import { TestBed } from '@angular/core/testing';
import { MobileFeedbackService } from '../../core/services/mobile-feedback.service';
import { TripPlannerPage } from './trip-planner.page';

describe('TripPlannerPage', () => {
  let page: TripPlannerPage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MobileFeedbackService],
    });
    page = TestBed.runInInjectionContext(() => new TripPlannerPage());
  });

  it('offers multiple popular Philippine destinations', () => {
    expect(page.destinations.length).toBeGreaterThanOrEqual(10);
    expect(page.matchingDestinations().length).toBe(8);
  });

  it('finds a destination when searching for one of its landmarks', () => {
    page.updateDestinationSearch('Intramuros');

    expect(page.matchingDestinations().some((destination) => destination.name === 'Manila')).toBe(true);
  });

  it('selects a suggested destination', () => {
    const destination = page.destinations.find((item) => item.id === 'boracay');
    expect(destination).toBeDefined();
    if (!destination) return;

    page.selectDestination(destination);

    expect(page.selectedDestination()?.name).toBe('Boracay');
    expect(page.destinationSearch()).toBe('Boracay, Aklan');
    expect(page.suggestionsVisible()).toBe(false);
  });

  it('uses the selected start date for itinerary day labels', () => {
    page.updateTripStartDate({
      detail: { value: `${page.minimumTripDate}T00:00:00` },
    } as CustomEvent<{ value?: string | string[] | null }>);

    expect(page.tripStartDate()).toBe(page.minimumTripDate);
    expect(page.getDateLabel(0)).toContain(page.minimumTripDate.split('-')[2]);
  });

  it('clears the itinerary and its photo state', () => {
    page.planCreated.set(true);
    page.selectedImage.set({
      thumbnail: 'https://example.com/photo.jpg',
      original: 'https://example.com/photo.jpg',
      filePage: 'https://commons.wikimedia.org/wiki/File:Photo.jpg',
      fileName: 'Photo.jpg',
      artist: 'Photographer',
      license: 'CC BY-SA 4.0',
    });

    page.deletePlan();

    expect(page.planCreated()).toBe(false);
    expect(page.photoStates()).toEqual({});
    expect(page.selectedImage()).toBeNull();
  });
});
