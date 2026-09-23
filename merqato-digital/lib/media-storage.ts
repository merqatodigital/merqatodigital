import { AwsClient } from 'aws4fetch';

function storage(){
 const endpoint=process.env.AWS_ENDPOINT_URL_S3;
 const accessKeyId=process.env.AWS_ACCESS_KEY_ID;
 const secretAccessKey=process.env.AWS_SECRET_ACCESS_KEY;
 const region=process.env.AWS_REGION||'ap-southeast-1';
 if(!endpoint||!accessKeyId||!secretAccessKey)throw new Error('Neon storage credentials are missing');
 return {endpoint:endpoint.replace(/\/$/,''),client:new AwsClient({accessKeyId,secretAccessKey,region,service:'s3'})};
}
function url(endpoint:string,bucket:string,key:string){return `${endpoint}/${encodeURIComponent(bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;}
export async function putMedia(bucket:string,key:string,bytes:Uint8Array,type:string){const {endpoint,client}=storage();const res=await client.fetch(url(endpoint,bucket,key),{method:'PUT',body:bytes as BodyInit,headers:{'Content-Type':type,'Cache-Control':'public, max-age=3600'}});if(!res.ok)throw new Error(`Neon storage upload returned ${res.status}`);}
export async function getMedia(bucket:string,key:string){const {endpoint,client}=storage();const res=await client.fetch(url(endpoint,bucket,key));if(res.status===404)return null;if(!res.ok)throw new Error(`Neon storage download returned ${res.status}`);return new Uint8Array(await res.arrayBuffer());}
export async function deleteMedia(bucket:string,key:string){const {endpoint,client}=storage();const res=await client.fetch(url(endpoint,bucket,key),{method:'DELETE'});if(!res.ok&&res.status!==404)throw new Error(`Neon storage delete returned ${res.status}`);}
export const mediaKey=(id:string)=>`media/${id}`;
