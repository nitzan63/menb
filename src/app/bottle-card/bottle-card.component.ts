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
  ngOnInit(): void {
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
    // Always open viewer when clicking image (for non-admins)
    if (!this.isAdmin()) {
      event.preventDefault();
      event.stopPropagation();
      this.view(this.b);
    }
  }

  isAdmin(): boolean {
    const result = this.remult.isAllowed(Roles.admin);
    // Debug: log to see if admin check is working
    console.log('isAdmin check:', result, 'authenticated:', this.remult.authenticated());
    return result;
  }


}
