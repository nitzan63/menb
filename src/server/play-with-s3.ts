import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Remult } from 'remult';
import type { Response } from 'express';
import { BottleImages } from '../app/bottles/bottles';
import { pipeline } from 'stream';
import { promisify } from 'util';

export const config = {
  schema: 'menb',
  folder: 'bottleImages',
};

export const galleryConfig = {
  schema: 'menb',
  folder: 'galleryImages',
};

export async function playWithS3(remult: Remult) {
  return;
  let i = 0;
  const query = await remult.repo(BottleImages).query({
    where: {
      image: { '!=': 's3' },
    },
  });
  let total = await query.count();
  for await (const image of query) {
    const result = await base64ToS3(image.id, image.image);
    if (result.$metadata.httpStatusCode == 200) {
      image.image = 's3';
      await image.save();
      console.log('saved', i++, 'of', total);
    } else {
      console.log(result);
    }
    //console.log(result);
  }
}

export async function base64ToS3(key: string, image: string, folder: string = config.folder) {
  const s3Client = new S3Client({ region: 'eu-west-1' });
  let split = image.split(',');
  let type = split[0].substring(5).replace(';base64', '');
  const buffer = Buffer.from(split[1], 'base64');
  const result = await s3Client.send(
    new PutObjectCommand({
      Bucket: 'menb',
      Key: config.schema + '/' + folder + '/' + key,
      ContentType: type,
      Body: buffer,
    })
  );
  return result;
}

export async function getFromS3(key: string, folder: string = config.folder) {
  const s3Client = new S3Client({ region: 'eu-west-1' });
  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: 'menb',
      Key: config.schema + '/' + folder + '/' + key,
    })
  );
  return {
    ContentType: result.ContentType,

    async getBuffer() {
      return Buffer.from(await result.Body?.transformToByteArray()!);
    },
    writeToResponse(response: Response) {
      response.contentType(result.ContentType!);
      const pipelinePromise = promisify(pipeline);
      return pipelinePromise(
        result.Body!.transformToWebStream() as any as NodeJS.ReadableStream,
        response
      );
    },
  };
}
