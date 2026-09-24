import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function storage() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-southeast-1';
  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error('Neon storage credentials are missing');
  return {
    endpoint: endpoint.replace(/\/$/, ''),
    client: new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
  };
}

export async function putMedia(bucket: string, key: string, bytes: Uint8Array, type: string): Promise<void> {
  const { endpoint, client } = storage();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(bytes),
    ContentType: type,
    CacheControl: 'public, max-age=3600',
  });
  await client.send(command);
}

export async function getMedia(bucket: string, key: string): Promise<Uint8Array | null> {
  const { endpoint, client } = storage();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await client.send(command);
  const body = response.Body;
  if (!body) return null;
  const chunks: Buffer[] = [];
  for await (const chunk of body as any) {
    chunks.push(Buffer.from(chunk));
  }
  return new Uint8Array(Buffer.concat(chunks));
}

export async function deleteMedia(bucket: string, key: string): Promise<void> {
  const { endpoint, client } = storage();
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await client.send(command);
}

export function mediaKey(id: string): string {
  return `media/${id}`;
}

export function signedUrl(bucket: string, key: string, contentType: string, expiresSec: number = 3600): string {
  const { endpoint, client } = storage();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Expires: expiresSec,
  });
  return client.utilities.getSignedUrl(command);
}
