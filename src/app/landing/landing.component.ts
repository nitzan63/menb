import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  categories = [
    { name: 'Whisky', image: 'assets/categories/whiskey.jpg' },
    { name: 'Cognac', image: 'assets/categories/cognac.jpg' },
    { name: 'Vodka', image: 'assets/categories/vodka.jpg' },
    { name: 'Rum', image: 'assets/categories/rum.jpg' }
  ];

  countries = [
    { name: 'Israel', flag: '🇮🇱' },
    { name: 'Japan', flag: '🇯🇵' },
    { name: 'Holland', flag: '🇳🇱' },
    { name: 'Italy', flag: '🇮🇹' },
    { name: 'USA', flag: '🇺🇸' },
    { name: 'France', flag: '🇫🇷' }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  navigateToCategory(categoryName: string): void {
    this.router.navigate(['/'], { queryParams: { category: categoryName } });
  }

  navigateToCountry(countryName: string): void {
    this.router.navigate(['/'], { queryParams: { country: countryName } });
  }

  navigateToBrowseAll(): void {
    this.router.navigate(['/']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/wine.png';
    }
  }
}

