import { Component, OnInit } from '@angular/core';
import { Remult } from 'remult';
import { GridSettings, openDialog } from '@remult/angular';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { DialogService } from '../common/dialog';
import { Roles } from '../users/roles';
import { CollectionInfo, Gallery, Article } from './collection-data';
import { UploadImageComponent } from '../bottles/upload-image.component';

@Component({
  selector: 'app-my-collection',
  templateUrl: './my-collection.component.html',
  styleUrls: ['./my-collection.component.scss']
})
export class MyCollectionComponent implements OnInit {

  collectionInfo: CollectionInfo | null = null;
  galleries: Gallery[] = [];
  articles: Article[] = [];
  currentGalleryIndex = 0;

  // Admin grids
  galleriesGrid?: GridSettings<Gallery>;
  articlesGrid?: GridSettings<Article>;

  constructor(public remult: Remult, private dialog: DialogService) { }

  async ngOnInit(): Promise<void> {
    await this.loadData();
    
    if (this.isAdmin()) {
      this.galleriesGrid = new GridSettings(this.remult.repo(Gallery), {
        allowCrud: true,
        orderBy: { order: 'asc' },
        columnSettings: g => [g.title, g.imageUrl, g.order],
        rowButtons: [{
          name: 'Edit',
          click: async (gallery) => {
            await this.editGallery(gallery);
            await this.loadData();
          }
        }]
      });

      this.articlesGrid = new GridSettings(this.remult.repo(Article), {
        allowCrud: true,
        orderBy: { date: 'desc' },
        columnSettings: a => [a.title, a.date, a.excerpt],
        rowButtons: [{
          name: 'Edit',
          click: async (article) => {
            await this.editArticle(article);
            await this.loadData();
          }
        }]
      });
    }
  }

  async loadData(): Promise<void> {
    try {
      // Load collection info (get first or null)
      this.collectionInfo = await this.remult.repo(CollectionInfo).findFirst();

      // Load galleries
      this.galleries = await this.remult.repo(Gallery).find();
      // Sort by order
      this.galleries.sort((a, b) => (a.order || 0) - (b.order || 0));
      if (this.currentGalleryIndex >= this.galleries.length) {
        this.currentGalleryIndex = 0;
      }

      // Load articles
      this.articles = await this.remult.repo(Article).find();
    } catch (error) {
      console.error('Error loading collection data:', error);
      // Set defaults on error
      this.collectionInfo = null;
      this.galleries = [];
      this.articles = [];
    }
  }

  isAdmin(): boolean {
    return this.remult.isAllowed(Roles.admin);
  }

  async editCollectionInfo(): Promise<void> {
    try {
      // Get or create collection info
      let info = await this.remult.repo(CollectionInfo).findFirst();
      if (!info) {
        info = this.remult.repo(CollectionInfo).create();
      }
      
      await openDialog(InputAreaComponent, d => d.args = {
        title: 'Edit Collection Information',
        fields: () => [
          info.$.description,
          info.$.email,
          info.$.phone,
          info.$.location
        ],
        ok: async () => {
          await info._.save();
          await this.loadData();
        }
      });
    } catch (error) {
      console.error('Error editing collection info:', error);
      this.dialog.error('Failed to edit collection info: ' + (error as Error).message);
    }
  }

  async editGallery(gallery?: Gallery): Promise<void> {
    const g = gallery || this.remult.repo(Gallery).create();
    
    // If creating new gallery, save it first to get an ID for image upload
    if (!gallery && g._.isNew()) {
      await g._.save();
    }
    
    await openDialog(InputAreaComponent, d => d.args = {
      title: gallery ? 'Edit Gallery' : 'Add Gallery',
      fields: () => [
        g.$.title,
        g.$.order
      ],
      buttons: [
        {
          text: 'Upload Image',
          click: async (close) => {
            await openDialog(UploadImageComponent, (x) =>
              (x.args = {
                bottleId: g.id, // Reuse the same component structure
                afterUpload: (image: string, fileName: string) => {
                  g.imageUrl = image;
                },
              })
            );
            // Don't close the main dialog, just the upload dialog
          }
        }
      ],
      ok: async () => {
        await g._.save();
        await this.loadData();
      }
    });
  }

  galleryImageSrc(gallery: Gallery): string {
    if (!gallery.imageUrl) {
      return 'assets/wine.png';
    }
    // If it's a URL (http/https), return as is
    if (gallery.imageUrl.startsWith('http')) {
      return gallery.imageUrl;
    }
    // If it's base64, return directly
    if (gallery.imageUrl.includes(',')) {
      return gallery.imageUrl;
    }
    // If it's 's3', use the API endpoint
    if (gallery.imageUrl === 's3') {
      return '/api/gallery-images/' + gallery.id;
    }
    return 'assets/wine.png';
  }

  async deleteGallery(gallery: Gallery): Promise<void> {
    if (await this.dialog.confirmDelete('Gallery: ' + gallery.title)) {
      await gallery._.delete();
      await this.loadData();
    }
  }

  async editArticle(article?: Article): Promise<void> {
    const a = article || this.remult.repo(Article).create();
    await openDialog(InputAreaComponent, d => d.args = {
      title: article ? 'Edit Article' : 'Add Article',
      fields: () => [
        a.$.title,
        a.$.date,
        a.$.excerpt,
        a.$.content
      ],
      ok: async () => {
        await a._.save();
        await this.loadData();
      }
    });
  }

  async deleteArticle(article: Article): Promise<void> {
    if (await this.dialog.confirmDelete('Article: ' + article.title)) {
      await article._.delete();
      await this.loadData();
    }
  }

  nextGallery(): void {
    if (this.currentGalleryIndex < this.galleries.length - 1) {
      this.currentGalleryIndex++;
    }
  }

  previousGallery(): void {
    if (this.currentGalleryIndex > 0) {
      this.currentGalleryIndex--;
    }
  }

  goToGallery(index: number): void {
    this.currentGalleryIndex = index;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/wine.png';
    }
  }
}

