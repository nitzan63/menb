import { Entity, Field, IdEntity, Remult, isBackend } from 'remult';
import { Roles } from '../users/roles';
import { base64ToS3, galleryConfig } from '../../server/play-with-s3';

@Entity<CollectionInfo>('CollectionInfo', {
  allowApiCrud: Roles.admin,
  allowApiRead: true
})
export class CollectionInfo extends IdEntity {
  @Field({ caption: 'Description' })
  description: string = '';

  @Field({ caption: 'Email' })
  email: string = '';

  @Field({ caption: 'Phone' })
  phone: string = '';

  @Field({ caption: 'Location' })
  location: string = '';

  constructor(public remult: Remult) {
    super();
  }
}

@Entity<Gallery>('Gallery', {
  allowApiCrud: Roles.admin,
  allowApiRead: true,
  defaultOrderBy: { order: 'asc' },
  saving: async (self) => {
    if (isBackend()) {
      // If image is base64 (not 's3' and not a URL), upload to S3
      if (self.imageUrl && self.imageUrl !== 's3' && !self.imageUrl.startsWith('http') && self.imageUrl.includes(',')) {
        await base64ToS3(self.id, self.imageUrl, galleryConfig.folder);
        self.imageUrl = 's3';
      }
    }
  }
})
export class Gallery extends IdEntity {
  @Field({ caption: 'Title' })
  title: string = '';

  @Field({ caption: 'Image' })
  imageUrl: string = '';

  @Field({ caption: 'Order' })
  order: number = 0;

  constructor(public remult: Remult) {
    super();
  }
}

@Entity<Article>('Article', {
  allowApiCrud: Roles.admin,
  allowApiRead: true,
  defaultOrderBy: { date: 'desc' },
})
export class Article extends IdEntity {
  @Field({ caption: 'Title' })
  title: string = '';

  @Field({ caption: 'Date' })
  date: string = '';

  @Field({ caption: 'Excerpt' })
  excerpt: string = '';

  @Field({ caption: 'Content' })
  content: string = '';

  constructor(public remult: Remult) {
    super();
  }
}

@Entity<HomeCategory>('HomeCategory', {
  allowApiCrud: Roles.admin,
  allowApiRead: true,
  defaultOrderBy: { displayOrder: 'asc' },
})
export class HomeCategory extends IdEntity {
  @Field({ caption: 'Display Name' })
  name: string = '';

  @Field({ caption: 'Filter Type (t:... value)' })
  filterValue: string = '';

  @Field({ caption: 'Image' })
  image: string = '';

  @Field({ caption: 'Order', dbName: 'display_order' })
  displayOrder: number = 0;

  @Field({ caption: 'Show on Home' })
  enabled: boolean = true;

  constructor(public remult: Remult) {
    super();
  }
}

@Entity<HomeCountry>('HomeCountry', {
  allowApiCrud: Roles.admin,
  allowApiRead: true,
  defaultOrderBy: { displayOrder: 'asc' },
})
export class HomeCountry extends IdEntity {
  @Field({ caption: 'Display Name' })
  name: string = '';

  @Field({ caption: 'Filter Country (c:... value)' })
  filterValue: string = '';

  @Field({ caption: 'Flag Emoji' })
  flagEmoji: string = '';

  @Field({ caption: 'Image' })
  image: string = '';

  @Field({ caption: 'Order', dbName: 'display_order' })
  displayOrder: number = 0;

  @Field({ caption: 'Show on Home' })
  enabled: boolean = true;

  constructor(public remult: Remult) {
    super();
  }
}

@Entity<SiteSettings>('SiteSettings', {
  allowApiCrud: Roles.admin,
  allowApiRead: true,
})
export class SiteSettings extends IdEntity {
  @Field({ caption: 'Welcome Title' })
  welcomeTitle: string = "Welcome to Menachem's Bottles Collection";

  @Field({ caption: 'Show Description' })
  showDescription: boolean = false;

  @Field({ caption: 'Description' })
  description: string = '';

  constructor(public remult: Remult) {
    super();
  }
}


