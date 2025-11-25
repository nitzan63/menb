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

