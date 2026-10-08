import { Injectable } from '@angular/core';

export interface PhilippineRegion {
  code: string;
  name: string;
  regionName: string;
  islandGroup: 'Luzon' | 'Visayas' | 'Mindanao';
}

export interface PhilippineProvince {
  code: string;
  name: string;
  regionCode: string;
}

export interface PhilippineCityMunicipality {
  code: string;
  name: string;
  provinceCode: string;
  regionCode: string;
  isCity: boolean;
  isMunicipality: boolean;
}

export interface PhilippineBarangay {
  code: string;
  name: string;
  parentCode: string;
}

interface PhilippineLocationData {
  regions: PhilippineRegion[];
  provinces: PhilippineProvince[];
  cities: PhilippineCityMunicipality[];
}

@Injectable({ providedIn: 'root' })
export class PhilippineLocationService {
  private locationsPromise?: Promise<PhilippineLocationData>;
  private barangaysByCityPromise?: Promise<Map<string, PhilippineBarangay[]>>;

  async getLocations(): Promise<PhilippineLocationData> {
    this.locationsPromise ??= this.fetchJson<PhilippineLocationData>('philippine-locations.json')
      .catch((error: unknown) => {
        this.locationsPromise = undefined;
        throw error;
      });
    return this.locationsPromise;
  }

  async getBarangays(cityMunicipalityCode: string): Promise<PhilippineBarangay[]> {
    this.barangaysByCityPromise ??= this.fetchJson<PhilippineBarangay[]>('philippine-barangays.json')
      .then((barangays) => {
        const index = new Map<string, PhilippineBarangay[]>();
        for (const barangay of barangays) {
          const group = index.get(barangay.parentCode) ?? [];
          group.push(barangay);
          index.set(barangay.parentCode, group);
        }
        return index;
      })
      .catch((error: unknown) => {
        this.barangaysByCityPromise = undefined;
        throw error;
      });
    return (await this.barangaysByCityPromise).get(cityMunicipalityCode) ?? [];
  }

  private async fetchJson<T>(filename: string): Promise<T> {
    const url = new URL(`assets/data/${filename}`, document.baseURI);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Location data could not be loaded (HTTP ${response.status}).`);
    }
    return await response.json() as T;
  }
}
