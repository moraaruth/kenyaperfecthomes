export interface ImageAssetRef {
  publicId: string;
  resourceType: string;
}

export interface CloudinaryDestroyResult {
  result?: string;
}

// Legacy string entries are plain URLs without a publicId, so they are skipped.
export function getImageAssetRefs(images: unknown[] = []): ImageAssetRef[] {
  const seen = new Set<string>();
  const refs: ImageAssetRef[] = [];

  for (const image of images) {
    if (!image || typeof image !== 'object') continue;
    const { publicId, resourceType } = image as { publicId?: unknown; resourceType?: unknown };
    if (typeof publicId !== 'string' || !publicId) continue;

    const type = typeof resourceType === 'string' && resourceType ? resourceType : 'image';
    const key = `${type}:${publicId}`;
    if (seen.has(key)) continue;

    seen.add(key);
    refs.push({ publicId, resourceType: type });
  }

  return refs;
}

// Cloudinary returns 'not found' for assets that are already gone, which counts as deleted.
// Returns the publicIds that could not be removed, so the caller can keep the listing and retry.
export async function destroyImageAssets(
  refs: ImageAssetRef[],
  destroy: (ref: ImageAssetRef) => Promise<CloudinaryDestroyResult>
): Promise<string[]> {
  const failed: string[] = [];

  for (const ref of refs) {
    try {
      const response = await destroy(ref);
      if (response.result !== 'ok' && response.result !== 'not found') {
        failed.push(ref.publicId);
      }
    } catch {
      failed.push(ref.publicId);
    }
  }

  return failed;
}
