import { Component, OnInit } from '@angular/core';
import { Remult } from 'remult';
import { GridSettings, openDialog } from '@remult/angular';
import { Roles } from '../users/roles';
import { DialogService } from '../common/dialog';
import { HomeCategory, HomeCountry } from '../my-collection/collection-data';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { UploadImageComponent } from '../bottles/upload-image.component';

@Component({
  selector: 'app-home-config',
  templateUrl: './home-config.component.html',
  styleUrls: ['./home-config.component.scss'],
})
export class HomeConfigComponent implements OnInit {
  categoriesGrid?: GridSettings<HomeCategory>;
  countriesGrid?: GridSettings<HomeCountry>;

  constructor(public remult: Remult, private dialog: DialogService) {}

  ngOnInit(): void {
    if (!this.remult.isAllowed(Roles.admin)) {
      return;
    }

    this.categoriesGrid = new GridSettings(this.remult.repo(HomeCategory), {
      allowCrud: true,
      orderBy: { order: 'asc' },
      columnSettings: (c) => [c.name, c.filterValue, c.order, c.enabled],
      rowButtons: [
        {
          name: 'Edit',
          click: async (category) => {
            await this.editCategory(category);
          },
        },
      ],
    });

    this.countriesGrid = new GridSettings(this.remult.repo(HomeCountry), {
      allowCrud: true,
      orderBy: { order: 'asc' },
      columnSettings: (c) => [c.name, c.filterValue, c.flagEmoji, c.order, c.enabled],
      rowButtons: [
        {
          name: 'Edit',
          click: async (country) => {
            await this.editCountry(country);
          },
        },
      ],
    });
  }

  private async editCategory(category?: HomeCategory): Promise<void> {
    const repo = this.remult.repo(HomeCategory);
    const c = category || repo.create();

    // Ensure we have an id for uploads
    if (!category && c._.isNew()) {
      await c._.save();
    }

    await openDialog(InputAreaComponent, (d) => {
      d.args = {
        title: category ? 'Edit Home Category' : 'Add Home Category',
        fields: () => [c.$.name, c.$.filterValue, c.$.order, c.$.enabled],
        buttons: [
          {
            text: 'Upload Image',
            click: async () => {
              await openDialog(UploadImageComponent, (x) => {
                x.args = {
                  bottleId: c.id,
                  afterUpload: (image: string) => {
                    c.image = image;
                  },
                };
              });
            },
          },
        ],
        ok: async () => {
          await c._.save();
        },
      };
    });
  }

  private async editCountry(country?: HomeCountry): Promise<void> {
    const repo = this.remult.repo(HomeCountry);
    const c = country || repo.create();

    await openDialog(InputAreaComponent, (d) => {
      d.args = {
        title: country ? 'Edit Home Country' : 'Add Home Country',
        fields: () => [c.$.name, c.$.filterValue, c.$.flagEmoji, c.$.order, c.$.enabled],
        ok: async () => {
          await c._.save();
        },
      };
    });
  }
}


