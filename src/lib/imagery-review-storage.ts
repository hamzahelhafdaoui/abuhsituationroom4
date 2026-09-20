import { parseImageryReview, type ImageryReview } from "./imagery-review";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ahsr-imagery-reviews", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("reviews", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Browser storage unavailable"));
    request.onblocked = () => reject(new Error("Close other review tabs to unlock storage."));
  });
}
export async function saveImageryReview(review: ImageryReview): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("reviews", "readwrite");
      tx.objectStore("reviews").put(review);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not save review"));
      tx.onabort = () => reject(tx.error ?? new Error("Review save was aborted"));
    });
  } finally {
    db.close();
  }
}
export async function listImageryReviews(): Promise<ImageryReview[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("reviews").objectStore("reviews").getAll();
      request.onsuccess = () => {
        try {
          resolve(
            request.result
              .map((r) => parseImageryReview(JSON.stringify(r)))
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
          );
        } catch {
          reject(
            new Error("A saved review could not be read. Existing storage has not been changed."),
          );
        }
      };
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
