import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Config } from "../config/env";

const s3Client = new S3Client({
  region: s3Config.region,
  endpoint: s3Config.endpoint,
  forcePathStyle: s3Config.forcePathStyle,
});

type UploadParams = {
  key: string;
  contentType: string;
  body: Buffer;
};

const buildObjectUrl = (key: string): string => {
  if (s3Config.endpoint) {
    const base = s3Config.endpoint.replace(/\/$/, "");
    if (s3Config.forcePathStyle) {
      return `${base}/${s3Config.bucket}/${key}`;
    }
    return `${base}/${key}`;
  }
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
};

export async function uploadToS3({ key, contentType, body }: UploadParams): Promise<{ key: string; url: string }> {
  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return {
    key,
    url: buildObjectUrl(key),
  };
}

export async function generateSignedGetUrl(key: string, expiresInSeconds = 120): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export const storageConfig = {
  bucket: s3Config.bucket,
  region: s3Config.region,
  endpoint: s3Config.endpoint,
  forcePathStyle: s3Config.forcePathStyle,
};
