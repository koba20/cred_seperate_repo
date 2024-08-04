import { v2 as cloudinary } from 'cloudinary';
import config from '../../config/config';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export const uploadBase64File = async (
  base64File: string,
  folder = 'uploads',
  public_id: string
) => {
  try {
    const response = await cloudinary.uploader.upload(base64File, {
      public_id,
      folder,
      resource_type: 'auto',
    });
    return response;
  } catch (err: any) {
    console.error(err);
    throw new Error(err.message);
  }
};

export const deleteFile = async (publicId: string, type = 'image') => {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
      invalidate: true,
    });
    return response;
  } catch (err: any) {
    console.error(err);
    throw new Error(err.message);
  }
};

export const uploadVideo = async (
  video: string,
  folder = 'uploads',
  public_id: string
) => {
  try {
    const response = await cloudinary.uploader.upload(video, {
      folder,
      public_id,
      resource_type: 'auto',
    });

    return response;
  } catch (err: any) {
    console.error(err);
    throw new Error(err.message);
  }
};



export async function generateThumbnail(videoPath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const thumbnailStream = ffmpeg(videoPath)
      .on('error', (err) => reject(err))
      .screenshots({
        count: 1,
        filename: '%b-thumbnail.png',
        folder: '/tmp',
        size: '320x240',
      })
      .on('end', () => {
        const thumbnail = Readable.from(thumbnailBuffers).toString();
        resolve(thumbnail);
      });

    const thumbnailBuffers: Buffer[] = [];

    thumbnailStream.on('data', (data) => {
      thumbnailBuffers.push(data);
    });

    thumbnailStream.on('end', () => {
      const thumbnailBuffer = Buffer.concat(thumbnailBuffers);
      const thumbnail = thumbnailBuffer.toString('base64');
      resolve(thumbnail);
    });
  });
}
