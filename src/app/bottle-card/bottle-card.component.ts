import { Component, Input, OnInit } from '@angular/core';
import { openDialog } from '@remult/angular';
import { Remult } from 'remult';
import { BottleInfoComponent } from '../bottle-info/bottle-info.component';
import { BottleViewComponent } from '../bottle-view/bottle-view.component';
import { Bottles } from '../bottles/bottles';
import { Roles } from '../users/roles';

@Component({
  selector: 'app-bottle-card',
  templateUrl: './bottle-card.component.html',
  styleUrls: ['./bottle-card.component.scss']
})
export class BottleCardComponent implements OnInit {

  constructor(private remult: Remult) { }
  @Input() b!: Bottles;

  private touchStartX = 0;
  private touchStartY = 0;
  private readonly TOUCH_THRESHOLD = 10;

  ngOnInit(): void {
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length > 0) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
    }
  }

  private isTouchMove(event: TouchEvent): boolean {
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - this.touchStartX);
      const deltaY = Math.abs(touch.clientY - this.touchStartY);
      return deltaX > this.TOUCH_THRESHOLD || deltaY > this.TOUCH_THRESHOLD;
    }
    return false;
  }
  async edit(bottle: Bottles) {
    await openDialog(BottleInfoComponent, c => c.args = {
      bottle: bottle
    });
    bottle.imageReloadVersion++;

  }
  async view(bottle: Bottles) {
    await openDialog(BottleViewComponent, c => c.args = {
      bottle: bottle
    });
  }

  onCardClick(event: MouseEvent | TouchEvent) {
    // For touch events, check if it was a scroll (touch moved)
    if (event instanceof TouchEvent && this.isTouchMove(event)) {
      return;
    }

    // Only open viewer if not admin and click wasn't on a button or image
    const target = event.target as HTMLElement;
    const isButton = target.tagName === 'BUTTON' || target.closest('button') !== null;
    const isImage = target.tagName === 'IMG';

    if (!this.isAdmin() && !isButton && !isImage) {
      event.preventDefault();
      event.stopPropagation();
      this.view(this.b);
    }
  }

  onImageClick(event: MouseEvent | TouchEvent) {
    // For touch events, check if it was a scroll (touch moved)
    if (event instanceof TouchEvent && this.isTouchMove(event)) {
      return;
    }

    // Always open viewer when clicking image (for non-admins)
    if (!this.isAdmin()) {
      event.preventDefault();
      event.stopPropagation();
      this.view(this.b);
    }
  }

  isAdmin(): boolean {
    return this.remult.isAllowed(Roles.admin);
  }


}
