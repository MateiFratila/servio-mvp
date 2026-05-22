const { BlobServiceClient } = require('@azure/storage-blob')
const { randomUUID } = require('crypto')

function getContainerClient() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connStr) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set')
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'session-documents'
  const serviceClient = BlobServiceClient.fromConnectionString(connStr)
  return serviceClient.getContainerClient(containerName)
}

/**
 * Uploads a file buffer to Azure Blob Storage.
 * Returns the blob name (path within the container) to store in the DB.
 */
async function uploadBlob(sessionId, buffer, contentType) {
  const blobName = `sessions/${sessionId}/${randomUUID()}`
  const container = getContainerClient()
  const blockBlobClient = container.getBlockBlobClient(blobName)
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  })
  return blobName
}

/**
 * Generates a short-lived (5-minute) read-only SAS URL for a blob.
 * The caller should redirect the client to this URL.
 */
async function getDownloadUrl(blobName, expiryMinutes = 5) {
  const container = getContainerClient()
  const blobClient = container.getBlobClient(blobName)
  const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000)
  const url = await blobClient.generateSasUrl({
    expiresOn,
    permissions: 'r',
  })
  return url
}

/**
 * Deletes a blob from Azure Blob Storage. No-ops if the blob does not exist.
 */
async function deleteBlob(blobName) {
  const container = getContainerClient()
  const blobClient = container.getBlobClient(blobName)
  await blobClient.deleteIfExists()
}

module.exports = { uploadBlob, getDownloadUrl, deleteBlob }
