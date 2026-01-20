import {
  IdEntity,
  Entity,
  OneToMany,
  Field,
  DateOnlyField,
  IntegerField,
  Remult,
  Allow,
  Filter,
  EntityFilter,
  ContainsStringValueFilter,
  isBackend,
} from 'remult';

import {
  Countries,
  BottleTypes,
  Shapes,
  Types,
  States,
  Locations,
} from '../manage/countries';
import { Roles } from '../users/roles';
import { base64ToS3 } from '../../server/play-with-s3';

@Entity<Bottles>('Bottles', {
  allowApiCrud: Roles.admin,
  allowApiRead: true,
  defaultOrderBy: { createDate: 'desc' },
  saving: (self) => {
    if (self.isNew()) self.createDate = new Date();
  },
})
export class Bottles extends IdEntity {
  images = new OneToMany(this.remult.repo(BottleImages), {
    where: { bottleId: this.id },
  });
  @Field()
  name: string = '';
  @Field()
  manufacturer: string = '';
  @Field()
  country?: Countries;
  @Field()
  comments: string = '';
  @Field()
  bottleType?: BottleTypes;
  @Field()
  shape?: Shapes;
  @Field()
  shapeComments: string = '';
  @Field()
  type?: Types;
  @Field()
  subType: string = '';
  @Field()
  quantity: number = 0;
  @Field({ includeInApi: Roles.admin })
  state?: States;
  @Field({ includeInApi: Roles.admin })
  location?: Locations;
  @Field()
  alcohol: number = 0;
  @IntegerField()
  volume: number = 0;
  @DateOnlyField({ includeInApi: Roles.admin })
  entryDate?: Date;
  @Field({ includeInApi: Roles.admin })
  origin: string = '';
  @Field({ includeInApi: Roles.admin })
  cost: number = 0;
  @DateOnlyField({ includeInApi: Roles.admin })
  exitDate?: Date;
  @Field({ includeInApi: Roles.admin })
  exitReason: string = '';
  @Field({ includeInApi: Roles.admin })
  worth: number = 0;
  @Field({ allowApiUpdate: false })
  createDate?: Date;
  @Field<Bottles>(
    {
      caption: 'תמונה',
    },
    (options, remult) =>
      (options.sqlExpression = async (self) => {
        var bi = remult.repo(BottleImages).metadata;
        return `( select count(*)>0 hasImage from ${await bi.getDbName()} where ${await bi.fields.bottleId.getDbName()} =${await bi.getDbName()}.${await self.fields.id.getDbName()} )`;
      })
  )
  hasImage: boolean = false;

  static search = Filter.createCustom<Bottles, string>(async (r, search) => {
    if (!search) return undefined!;
    const result: EntityFilter<Bottles>[] = [];
    for (let s of search.split(' ')) {
      s = s.trim();
      if (s != '') {
        let prefix = '';
        if (s.length > 1 && s[1] == ':') {
          prefix = s[0].toLowerCase();
          s = s.substring(2);
        }
        let contains: ContainsStringValueFilter = { $contains: s };
        const orConditions: any[] = [];
        
        if (prefix == 'n') {
          // Only search by name
          orConditions.push({ name: contains });
        } else if (prefix == 'm') {
          // Only search by manufacturer
          orConditions.push({ manufacturer: contains });
        } else if (prefix == 'c') {
          // Only search by country
          const matchingCountries = await r
            .repo(Countries)
            .find({ where: { name: contains } });
          if (matchingCountries.length > 0) {
            orConditions.push({
              country: matchingCountries,
            });
          }
        } else if (prefix == 't') {
          // Only search by type
          const matchingTypes = await r.repo(Types).find({ where: { name: contains } });
          if (matchingTypes.length > 0) {
            orConditions.push({
              type: matchingTypes,
            });
          }
        } else {
          // No prefix - search in all fields
          orConditions.push({ name: contains });
          orConditions.push({ manufacturer: contains });
          orConditions.push({ comments: contains });
          const matchingCountries = await r
            .repo(Countries)
            .find({ where: { name: contains } });
          if (matchingCountries.length > 0) {
            orConditions.push({
              country: matchingCountries,
            });
          }
          const matchingTypes = await r.repo(Types).find({ where: { name: contains } });
          if (matchingTypes.length > 0) {
            orConditions.push({
              type: matchingTypes,
            });
          }
        }
        
        // Always add to result if we have conditions
        // For prefix filters, if no matches found, add an impossible condition to show no results
        if (orConditions.length > 0) {
          result.push({ $or: orConditions });
        } else if (prefix) {
          // Prefix filter with no matches - return filter that matches nothing
          result.push({ id: 'no-matches-found-' + Date.now() });
        }
      }
    }
    if (result.length === 0) {
      return undefined!;
    }
    return { $and: result };
  });

  imageReloadVersion = 0;
  constructor(public remult: Remult) {
    super();
  }
}

@Entity<BottleImages>(
  'bottleImages',
  {
    allowApiCrud: Roles.admin,
    allowApiRead: true,
    defaultOrderBy: { num: 'asc' },
  },
  (options, remult) =>
    (options.saving = async (self) => {
      if (isBackend()) {
        if (self.image != 's3') {
          await base64ToS3(self.id, self.image);
          self.image = 's3';
          for (const smallImage of await remult
            .repo(SmallImages)
            .find({ where: { bottleId: self.bottleId } })) {
            await smallImage.delete();
          }
        }
      }
    })
)
export class BottleImages extends IdEntity {
  @Field()
  bottleId: string = '';
  @Field()
  image: string = '';
  @Field()
  fileName: string = '';
  @IntegerField()
  num: number = 0;
}

@Entity('smallImages', {
  allowApiCrud: false,
  defaultOrderBy: { num: 'asc' },
})
export class SmallImages extends IdEntity {
  @Field()
  bottleId: string = '';
  @Field()
  image: string = '';
  @Field()
  contentType: string = '';
  @IntegerField()
  num: number = 0;
}
