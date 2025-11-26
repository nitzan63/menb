import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Remult } from 'remult';
import { HomeCategory, HomeCountry } from '../my-collection/collection-data';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  categories: HomeCategory[] = [];
  countries: HomeCountry[] = [];

  constructor(private router: Router, private remult: Remult) { }

  async ngOnInit(): Promise<void> {
    await this.loadHomeConfig();
  }

  private async loadHomeConfig(): Promise<void> {
    try {
      this.categories = await this.remult.repo(HomeCategory).find({
        where: { enabled: true },
        orderBy: { order: 'asc' }
      });

      this.countries = await this.remult.repo(HomeCountry).find({
        where: { enabled: true },
        orderBy: { order: 'asc' }
      });
    } catch (error) {
      console.error('Failed to load home configuration', error);
      this.categories = [];
      this.countries = [];
    }
  }

  navigateToMyCollection(): void {
    this.router.navigate(['/my-collection']);
  }

  navigateToCategory(category: HomeCategory): void {
    const value = category.filterValue || category.name;
    this.router.navigate(['/bottles'], { queryParams: { category: value } });
  }

  navigateToCountry(country: HomeCountry): void {
    const value = country.filterValue || country.name;
    this.router.navigate(['/bottles'], { queryParams: { country: value } });
  }

  navigateToBrowseAll(): void {
    this.router.navigate(['/bottles']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/wine.png';
    }
  }
}

