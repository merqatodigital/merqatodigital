import { AwsClient } from 'aws4fetch';
import { json } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-southeast-1';
  
  const results: any = {};
  
  // Test 1: Basic HTTPS connectivity
  try {
    const start = Date.now();
    const res = await fetch('https://example.com', { signal: AbortSignal.timeout(10000) });
    results.basicconnectivity = { status: res.status, time: Date.now() - start };
  } catch (e: any) {
    results.basicconnectivity = { error: e.name, message: e.message };
  }
  
  const host = process.env.AWS_ENDPOINT_URL_S3;
  if (!host) {
    results.storageconnectivity = { error: 'AWS_ENDPOINT_URL_S3 not set' };
  } else {
    try {
      const start = Date.now();
      const res = await fetch(`${host}/logos?list-type=2`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: { 'Host': new URL(host).host }
      });
      results.storageconnectivity = { status: res.status, time: Date.now() - start };
    } catch (e: any) {
      results.storageconnectivity = { error: e.name, message: e.message };
    }
  }
  
  // Test 3: S3 signed PUT with tiny payload
  if (accessKeyId && secretAccessKey) {
    const client = new AwsClient({ accessKeyId, secretAccessKey, region, service: 's3' });
    const tinyPng = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41,0x54,0x08,0xd7,0x63,0xf8,0xff,0xff,0x3f,0x00,0x05,0xfe,0x02,0xfe,0xdc,0x32,0x00,0x00,0x00,0x00,0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82]);
    try {
      const start = Date.now();
      const res = await client.fetch(`${endpoint}/logos/test-debug.png`, {
        method: 'PUT',
        body: tinyPng,
        headers: { 'Content-Type': 'image/png' },
        signal: AbortSignal.timeout(15000)
      });
      results.s3put = { status: res.status, time: Date.now() - start };
    } catch (e: any) {
      results.s3put = { error: e.name, message: e.message };
    }
  }
  
  return json(results);
}
