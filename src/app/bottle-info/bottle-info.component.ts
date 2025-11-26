import { Component, OnInit } from '@angular/core';
import { BottleImages, Bottles } from '../bottles/bottles';

import { MatDialogRef } from '@angular/material/dialog';
import { UploadImageComponent } from '../bottles/upload-image.component';
import {
  openDialog,
  DataAreaSettings,
  SelectValueDialogComponent,
  DataControlSettings,
} from '@remult/angular';
import { FieldMetadata, FieldRef, Remult } from 'remult';

@Component({
  selector: 'app-bottle-info',
  templateUrl: './bottle-info.component.html',
  styleUrls: ['./bottle-info.component.scss'],
})
export class BottleInfoComponent implements OnInit {
  constructor(private dialog: MatDialogRef<any>, private remult: Remult) {
    dialog.afterClosed().subscribe(() => {
      if (this.saved) this.args.bottle._.undoChanges();
    });
  }
  args!: {
    bottle: Bottles;
  };
  images: BottleImages[] = [];
  imageIndex = 0;
  get image() {
    if (this.images.length == 0) {
      this.images.push(this.args.bottle.images.create());
      this.imageIndex = 0;
    }
    return this.images[this.imageIndex];
  }
  back() {
    if (this.imageIndex > 0) this.imageIndex--;
  }
  next() {
    if (this.imageIndex < this.images.length - 1) {
      this.imageIndex++;
    }
  }
  goToImage(index: number) {
    if (index >= 0 && index < this.images.length) {
      this.imageIndex = index;
    }
  }
  deleteThumbnail(index: number, event: Event) {
    event.stopPropagation();
    if (this.images[index]) {
      const imageToDelete = this.images[index];
      this.toDeleteImages.push(imageToDelete);
      this.images = this.images.filter((x) => x !== imageToDelete);
      if (this.imageIndex >= this.images.length)
        this.imageIndex = this.images.length - 1;
      if (this.imageIndex < 0) this.imageIndex = 0;
    }
  }
  addAPhoto() {
    this.images.push(this.args.bottle.images.create());
    this.imageIndex = this.images.length - 1;
    this.image.num = this.images.length;
  }
  deletePhoto() {
    this.toDeleteImages.push(this.image);
    this.images = this.images.filter((x) => x != this.image);
    if (this.imageIndex >= this.images.length)
      this.imageIndex = this.images.length - 1;
  }
  toDeleteImages: BottleImages[] = [];
  rightArea!: DataAreaSettings;
  leftArea!: DataAreaSettings;
  bottomArea!: DataAreaSettings;
  ngOnInit() {
    let b = this.args.bottle.$;
    this.rightArea = new DataAreaSettings({
      fields: (_) => [
        mapFieldType(b.country!),
        b.name,
        mapFieldType(b.manufacturer!),
        b.comments,
        [b.bottleType!, b.shape!].map(mapFieldType),
        b.shapeComments,
        [b.alcohol, b.volume],
      ],
    });
    this.leftArea = new DataAreaSettings({
      fields: () => [[b.type!, b.subType!].map(mapFieldType), b.quantity],
    });
    this.bottomArea = new DataAreaSettings({
      fields: () => [
        mapFieldType(b.state!),
        mapFieldType(b.location!),
        [b.entryDate!, b.origin],
        [b.cost, b.worth],
        [b.exitDate!, b.exitReason],
      ],
    });
    if (!this.args.bottle.isNew()) {
      this.args.bottle._.reload();
      this.remult
        .repo(BottleImages)
        .find({ where: { bottleId: this.args.bottle.id } })
        .then((x) => {
          this.images = x;
        });
    }
  }

  saved = false;
  async save() {
    await this.args.bottle.save();
    for (const i of this.images) {
      if (i.$.image.valueChanged()) {
        i.bottleId = this.args.bottle.id;
        await i.save();
        this.saved = true;
      }
    }
    for (const i of this.toDeleteImages) {
      await i.delete();
    }
    this.dialog.close();
  }
  close() {
    this.dialog.close();
  }
  async upload() {
    if (this.args.bottle.isNew()) await this.args.bottle.save();
    await openDialog(
      UploadImageComponent,
      (x) =>
        (x.args = {
          bottleId: this.args.bottle.id,
          afterUpload: (image, fileName) => {
            this.image.image = image;
            this.image.fileName = fileName;
          },
        })
    );
  }
  imageSrc(image: BottleImages) {
    return image._.wasChanged()
      ? image.image
      : '/api/images/' + image.bottleId + '?num=' + image.num;
  }
  openImage() {
    if (this.image.image) {
      var image = new Image();
      image.src = this.imageSrc(this.image);
      image.style.height = '100%';

      var w = window.open('');
      w!.document.write(image.outerHTML);
    }
  }
  async dropFile(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.inDrag = false;
    await this.loadFiles(e?.dataTransfer?.files);
  }
  private async loadFiles(files: any) {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      let f: File = file;
      await new Promise((res) => {
        var fileReader = new FileReader();

        fileReader.onload = async (e: any) => {
          this.image.image = e.target.result.toString();
          this.image.fileName = f.name;
          res({});
        };
        fileReader.readAsDataURL(f);
      });
    }
  }

  onFileInput(e: any) {
    this.loadFiles(e.target.files);
  }
  dragEnter(e: DragEvent) {
    this.inDrag = true;
    this.preventDefault(e);
  }
  dragLeave(e: DragEvent) {
    this.inDrag = false;
    this.preventDefault(e);
  }
  inDrag = false;
  preventDefault(eventArgs: any) {
    eventArgs.preventDefault();
    eventArgs.stopPropagation();
  }
}
export function mapFieldType(field: FieldMetadata | FieldRef) {
  let meta: FieldMetadata = (field as FieldRef).metadata;
  if (!meta) meta = field as FieldMetadata;

  if (meta.options.selectType) {
    return {
      field: field,
      hideDataOnInput: true,
      getValue: (_, x) => x.value?.name,
      click: async (row: { remult: Remult }, col) => {
        openDialog(SelectValueDialogComponent, async (x) =>
          x.args({
            values: (
              await row.remult.repo(meta.options.selectType!).find()
            ).map((item) => ({ caption: item.name, item })),
            onSelect: (x) => (col.value = x.item),
          })
        );
      },
    } as DataControlSettings;
  }
  return { field };
}
