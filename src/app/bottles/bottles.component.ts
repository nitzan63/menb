import { Component, isDevMode, OnInit } from '@angular/core';
import { Bottles } from './bottles';
import {
  BottleInfoComponent,
  mapFieldType,
} from '../bottle-info/bottle-info.component';
import { ChartType, ChartOptions } from 'chart.js';
import { Countries, LookupTableBase } from '../manage/countries';
import { MatPseudoCheckbox } from '@angular/material/core';
import { ImportExcelComponent } from './import-excel.component';
import { DialogService } from '../common/dialog';
import { columnOrderAndWidthSaver } from '../common/columnOrderAndWidthSaver';
import { UploadImageComponent } from './upload-image.component';
import {
  BusyService,
  DataControl,
  DataControlSettings,
  openDialog,
  SelectValueDialogComponent,
} from '@remult/angular';
import * as xlsx from 'xlsx';

import { GridSettings } from '@remult/angular';
import { MatButton } from '@angular/material/button';
import { Field, FieldMetadata, FieldRef, getFields, Remult } from 'remult';
import { ClassType } from 'remult/classType';
import { InputAreaComponent } from '../common/input-area/input-area.component';

@Component({
  selector: 'app-bottles',
  templateUrl: './bottles.component.html',
  styleUrls: ['./bottles.component.scss'],
})
export class BottlesComponent implements OnInit {
  constructor(
    private remult: Remult,
    private dialog: DialogService,
    private busy: BusyService
  ) {}
  @DataControl<BottlesComponent>({
    valueChange: async (self) => {
      // the call to `this.busy.donotWait` causes the load products method to run without the "Busy" circle in the ui
      await self.busy.donotWait(async () => await self.bottles.reloadData());
    },
  })
  @Field<BottlesComponent>({
    caption: 'bottle search',
  })
  searchString: string = '';
  get $() {
    return getFields(this);
  }

  @Field<BottleInfoComponent>({ caption: 'name' })
  misc = '';

  bottles = new GridSettings(this.remult.repo(Bottles), {
    knowTotalRows: true,
    allowCrud: true,
    allowDelete: false,
    allowSelection: true,
    gridButtons: [
      {
        name: 'קליטה מאקסל',
        click: async () => {
          await openDialog(ImportExcelComponent);
          this.bottles.reloadData();
        },
      },
      ...[
        this.remult.repo(Bottles).metadata.fields.type!,
        this.remult.repo(Bottles).metadata.fields.location!,
        this.remult.repo(Bottles).metadata.fields.bottleType!,
        this.remult.repo(Bottles).metadata.fields.country!,
        this.remult.repo(Bottles).metadata.fields.shape!,
        this.remult.repo(Bottles).metadata.fields.state!,
      ]
        .flatMap((meta) => {
          const r = [
            {
              meta,
              args: {
                name: 'Update ' + meta.caption,
                click: async () => {
                  if (meta.options.selectType) {
                    openDialog(SelectValueDialogComponent, async (x) =>
                      x.args({
                        values: (
                          await this.remult
                            .repo(meta.options.selectType!)
                            .find()
                        ).map((item) => ({ caption: item.name, item })),
                        onSelect: async (x) => {
                          for (const b of this.bottles.selectedRows) {
                            b.$.find(meta).value = x.item;
                          }
                        },
                      })
                    );
                  }
                },
              },
            },
          ];
          if (meta === this.remult.repo(Bottles).metadata.fields.type) {
            r.push({
              meta,
              args: {
                name: 'Update SubType',
                click: async () => {
                  this.misc = '';
                  openDialog(
                    InputAreaComponent,
                    (x) =>
                      (x.args = {
                        title: 'Update SubType',

                        fields: () => [
                          {
                            field: this.$.misc!,
                          },
                        ],
                        ok: async () => {
                          for (const b of this.bottles.selectedRows) {
                            b.subType = this.misc;
                          }
                        },
                      })
                  );
                },
              },
            });
          }
          return r;
        })
        .map((x) => x.args),
      {
        name: 'יצוא לאקסל',
        click: async () => {
          let result = [];

          for await (const p of this.remult
            .repo(Bottles)
            .query(await this.bottles.getFilterWithSelectedRows())) {
            let item: any = {};
            for (const col of p.$) {
              item[col.metadata.caption] = col.displayValue;
            }
            result.push(item);
          }
          let wb = xlsx.utils.book_new();
          xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(result));
          xlsx.writeFile(wb, 'bottles.xlsx');
        },
      },
    ],
    newRow: (bottle) => {
      this.edit(bottle);
    },
    where: () => Bottles.search(this.searchString),
    columnSettings: (b) => [
      ...b
        .toArray()
        .filter((x) => x != b.id)
        .map(mapFieldType),
    ],
    numOfColumnsInGrid: 3,
    rowButtons: [
      {
        textInMenu: 'פרטים',
        icon: 'edit',
        showInLine: true,

        click: (bottle) => {
          this.edit(bottle);
        },
      },
      {
        textInMenu: 'שכפל',
        click: async (b) => {
          this.bottles.addNewRow();
          let newb = this.bottles.currentRow;
          for (const col of b.$) {
            newb.$.find(col.metadata).value = col.value;
          }
          this.edit(newb);
        },
      },
      {
        textInMenu: 'מחק',
        icon: 'delete',

        click: async (b) => {
          if (await this.dialog.confirmDelete('Bottle ' + b.name)) {
            await b.delete();
          }
        },
      },
    ],
  });
  columnSaver = new columnOrderAndWidthSaver(this.bottles);

  nextPage(x: MatButton) {
    this.bottles.nextPage().then(() => {
      var e = x._elementRef.nativeElement;
      e.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        e.focus();
      }, 500);
    });
  }

  prevPage(x: MatButton) {
    this.bottles.previousPage().then(() => {
      var e = x._elementRef.nativeElement;
      e.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        e.focus();
      }, 500);
    });
  }
  async edit(bottle: Bottles) {
    await openDialog(
      BottleInfoComponent,
      (c) =>
        (c.args = {
          bottle: bottle,
        })
    );
    bottle.imageReloadVersion++;
  }

  ngOnInit() {
    this.columnSaver.load('bottles');
    if (false)
      setTimeout(() => {
        openDialog(
          BottleInfoComponent,
          (c) =>
            (c.args = {
              bottle: this.bottles.items[0],
            })
        );
      }, 1500);
  }
}
