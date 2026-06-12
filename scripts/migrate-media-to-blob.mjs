#!/usr/bin/env node

import { createHmac } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const apply = process.argv.includes('--apply');
const root = process.cwd();
const projectMediaDir = path.join(root, 'src/assets/images/projects');
const recognitionMediaDir = path.join(root, 'src/assets/images/recognition');

const requiredEnv = [
  'BLOB_STORAGE_CONNECTION_STRING',
  'BLOB_CONTAINER',
  'MEDIA_BASE_URL',
  'COSMOS_DB_CONNECTION_STRING',
  'COSMOS_DATABASE',
  'COSMOS_CONTAINER',
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`${name} is required`);
  }
}

const blobConfig = parseConnectionString(
  process.env.BLOB_STORAGE_CONNECTION_STRING
);
const cosmosConfig = parseConnectionString(process.env.COSMOS_DB_CONNECTION_STRING);
const blobContainer = process.env.BLOB_CONTAINER;
const mediaBaseUrl = process.env.MEDIA_BASE_URL.replace(/\/$/, '');
const cosmosDatabase = process.env.COSMOS_DATABASE;
const cosmosContainer = process.env.COSMOS_CONTAINER;

const contentTypesByExtension = new Map([
  ['.gif', 'image/gif'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.mp4', 'video/mp4'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);

const mediaFiles = [
  ...(await listMedia(projectMediaDir, 'projects')),
  ...(await listMedia(recognitionMediaDir, 'recognition')),
];
const replacements = new Map();

for (const media of mediaFiles) {
  const newUrl = `${mediaBaseUrl}/${media.blobName}`;
  replacements.set(`assets/images/${media.category}/${media.fileName}`, newUrl);
  replacements.set(`/assets/images/${media.category}/${media.fileName}`, newUrl);
  replacements.set(
    `https://www.ericslutz.dev/assets/images/${media.category}/${media.fileName}`,
    newUrl
  );
}

console.log(`${apply ? 'Applying' : 'Dry run for'} media migration`);
console.log(`Found ${mediaFiles.length} local media files`);

for (const media of mediaFiles) {
  console.log(`${apply ? 'Upload' : 'Would upload'} ${media.relativePath} -> ${media.blobName}`);
  if (apply) {
    await uploadBlob(media);
  }
}

const documents = await queryDocuments();
let changedDocuments = 0;

for (const document of documents) {
  const updated = rewriteDocument(document);
  if (!updated.changed) {
    continue;
  }

  changedDocuments += 1;
  console.log(
    `${apply ? 'Rewrite' : 'Would rewrite'} ${document.component} document ${document.id}`
  );

  if (apply) {
    await replaceDocument(updated.document);
  }
}

console.log(`${changedDocuments} Cosmos document(s) ${apply ? 'updated' : 'would be updated'}`);

async function listMedia(directory, category) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => {
      const extension = path.extname(entry.name).toLowerCase();
      const contentType = contentTypesByExtension.get(extension);
      if (!contentType) {
        throw new Error(`Unsupported media extension: ${entry.name}`);
      }

      return {
        category,
        contentType,
        fileName: entry.name,
        blobName: `${category}/${entry.name}`,
        path: path.join(directory, entry.name),
        relativePath: `src/assets/images/${category}/${entry.name}`,
      };
    });
}

async function uploadBlob(media) {
  const body = await readFile(media.path);
  const encodedBlobName = media.blobName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = `${blobConfig.BlobEndpoint ?? `https://${blobConfig.AccountName}.blob.core.windows.net/`}${blobContainer}/${encodedBlobName}`;
  const date = new Date().toUTCString();
  const headers = {
    'content-length': String(body.length),
    'content-type': media.contentType,
    'x-ms-blob-type': 'BlockBlob',
    'x-ms-date': date,
    'x-ms-version': '2023-11-03',
  };

  const authorization = blobAuthorizationHeader(
    'PUT',
    blobConfig.AccountName,
    blobConfig.AccountKey,
    `/${blobContainer}/${media.blobName}`,
    headers
  );

  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, authorization },
    body,
  });

  if (!response.ok && response.status !== 201) {
    throw new Error(`Blob upload failed for ${media.blobName}: ${response.status} ${await response.text()}`);
  }
}

async function queryDocuments() {
  const resourceLink = `dbs/${cosmosDatabase}/colls/${cosmosContainer}`;
  const date = new Date().toUTCString();
  const body = JSON.stringify({
    query:
      "SELECT * FROM c WHERE c.component = 'project' OR c.component = 'recognition'",
  });
  const response = await cosmosFetch('POST', 'docs', resourceLink, date, body, {
    'content-type': 'application/query+json',
    'x-ms-documentdb-isquery': 'true',
    'x-ms-documentdb-query-enablecrosspartition': 'true',
  });

  if (!response.ok) {
    throw new Error(`Cosmos query failed: ${response.status} ${await response.text()}`);
  }

  const json = await response.json();
  return json.Documents ?? [];
}

async function replaceDocument(document) {
  const resourceLink = `dbs/${cosmosDatabase}/colls/${cosmosContainer}/docs/${document.id}`;
  const date = new Date().toUTCString();
  const response = await cosmosFetch(
    'PUT',
    'docs',
    resourceLink,
    date,
    JSON.stringify(document),
    {
      'content-type': 'application/json',
      'x-ms-documentdb-partitionkey': JSON.stringify([document.id]),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Cosmos replace failed for ${document.id}: ${response.status} ${await response.text()}`
    );
  }
}

async function cosmosFetch(method, resourceType, resourceLink, date, body, extraHeaders) {
  const authorization = cosmosAuthorizationHeader(
    method,
    resourceType,
    resourceLink,
    date,
    cosmosConfig.AccountKey
  );
  const url = `${cosmosConfig.AccountEndpoint}${resourceLink}`;

  return fetch(url, {
    method,
    headers: {
      authorization,
      'x-ms-date': date,
      'x-ms-version': '2018-12-31',
      ...extraHeaders,
    },
    body,
  });
}

function rewriteDocument(document) {
  const cloned = structuredClone(document);
  let changed = false;

  if (cloned.component === 'project') {
    changed = rewriteProperty(cloned, 'imageSrc') || changed;
    changed = rewriteProperty(cloned, 'videoSrc') || changed;
  }

  if (cloned.component === 'recognition') {
    for (const company of cloned.companies ?? []) {
      for (const recognition of company.recognition ?? []) {
        changed = rewriteProperty(recognition, 'src') || changed;
      }
    }
  }

  return { changed, document: cloned };
}

function rewriteProperty(target, propertyName) {
  const value = target[propertyName];
  if (typeof value !== 'string') {
    return false;
  }

  const replacement = replacements.get(value);
  if (!replacement || replacement === value) {
    return false;
  }

  target[propertyName] = replacement;
  return true;
}

function parseConnectionString(connectionString) {
  return Object.fromEntries(
    connectionString
      .split(';')
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf('=');
        return [part.slice(0, separatorIndex), part.slice(separatorIndex + 1)];
      })
  );
}

function blobAuthorizationHeader(method, accountName, accountKey, resourcePath, headers) {
  const canonicalizedHeaders = Object.entries(headers)
    .filter(([name]) => name.toLowerCase().startsWith('x-ms-'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name.toLowerCase()}:${value}\n`)
    .join('');
  const stringToSign = [
    method,
    '',
    '',
    headers['content-length'],
    '',
    headers['content-type'],
    '',
    '',
    '',
    '',
    '',
    '',
    `${canonicalizedHeaders}/${accountName}${resourcePath}`,
  ].join('\n');
  const signature = createHmac('sha256', Buffer.from(accountKey, 'base64'))
    .update(stringToSign, 'utf8')
    .digest('base64');
  return `SharedKey ${accountName}:${signature}`;
}

function cosmosAuthorizationHeader(method, resourceType, resourceLink, date, accountKey) {
  const payload = `${method.toLowerCase()}\n${resourceType.toLowerCase()}\n${resourceLink}\n${date.toLowerCase()}\n\n`;
  const signature = createHmac('sha256', Buffer.from(accountKey, 'base64'))
    .update(payload, 'utf8')
    .digest('base64');
  return encodeURIComponent(`type=master&ver=1.0&sig=${signature}`);
}
