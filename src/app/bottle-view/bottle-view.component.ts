import { Component, OnInit, HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Remult } from 'remult';
import { Bottles, BottleImages } from '../bottles/bottles';

@Component({
  selector: 'app-bottle-view',
  templateUrl: './bottle-view.component.html',
  styleUrls: ['./bottle-view.component.scss']
})
export class BottleViewComponent implements OnInit {
  constructor(
    private dialog: MatDialogRef<any>,
    private remult: Remult
  ) {}

  args!: {
    bottle: Bottles;
  };

  images: BottleImages[] = [];
  currentImageIndex = 0;
  isZoomed = false;
  zoomScale = 1;
  zoomPosition = { x: 0, y: 0 };

  ngOnInit() {
    if (this.args.bottle && !this.args.bottle.isNew()) {
      this.loadBottleData();
    }
  }

  async loadBottleData() {
    try {
      // Reload bottle to get latest data
      await this.args.bottle._.reload();
      
      // Load all images for this bottle
      this.images = await this.remult.repo(BottleImages).find({
        where: { bottleId: this.args.bottle.id }
      });
      
      // Sort by num field
      this.images.sort((a, b) => (a.num || 0) - (b.num || 0));
      
      // If no images, show placeholder
      if (this.images.length === 0) {
        this.currentImageIndex = -1;
      }
    } catch (error) {
      console.error('Error loading bottle data:', error);
    }
  }

  get currentImage(): BottleImages | null {
    if (this.currentImageIndex >= 0 && this.currentImageIndex < this.images.length) {
      return this.images[this.currentImageIndex];
    }
    return null;
  }

  imageSrc(image: BottleImages): string {
    return '/api/images/' + image.bottleId + '?num=' + image.num;
  }

  nextImage() {
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
      this.resetZoom();
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.resetZoom();
    }
  }

  goToImage(index: number) {
    if (index >= 0 && index < this.images.length) {
      this.currentImageIndex = index;
      this.resetZoom();
    }
  }

  toggleZoom() {
    this.isZoomed = !this.isZoomed;
    if (!this.isZoomed) {
      this.resetZoom();
    }
  }

  resetZoom() {
    this.zoomScale = 1;
    this.zoomPosition = { x: 0, y: 0 };
    this.isZoomed = false;
  }

  onImageWheel(event: WheelEvent) {
    if (this.isZoomed) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.zoomScale = Math.max(1, Math.min(5, this.zoomScale + delta));
    }
  }

  onImageDrag(event: MouseEvent) {
    if (this.isZoomed && event.buttons === 1) {
      this.zoomPosition.x += event.movementX;
      this.zoomPosition.y += event.movementY;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        this.previousImage();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
      case 'Escape':
        if (this.isZoomed) {
          this.resetZoom();
        } else {
          this.close();
        }
        break;
      case '+':
      case '=':
        if (this.isZoomed) {
          this.zoomScale = Math.min(5, this.zoomScale + 0.2);
        }
        break;
      case '-':
        if (this.isZoomed) {
          this.zoomScale = Math.max(1, this.zoomScale - 0.2);
        }
        break;
    }
  }

  close() {
    this.dialog.close();
  }

  get hasImages(): boolean {
    return this.images.length > 0;
  }

  get canGoNext(): boolean {
    return this.currentImageIndex < this.images.length - 1;
  }

  get canGoPrevious(): boolean {
    return this.currentImageIndex > 0;
  }

  getZoomPercentage(): number {
    return Math.round(this.zoomScale * 100);
  }

  zoomIn() {
    this.zoomScale = Math.min(5, this.zoomScale + 0.2);
  }

  zoomOut() {
    this.zoomScale = Math.max(1, this.zoomScale - 0.2);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/wine.png';
    }
  }
}

