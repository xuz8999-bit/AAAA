import type { Memory } from "../components/Editor";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fragments-of-me", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("archive");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadMemories(): Promise<Memory[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("archive", "readonly")
      .objectStore("archive")
      .get("memories");
    request.onsuccess = () => {
      resolve(request.result || []);
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}
export async function storeMemories(memories: Memory[]): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("archive", "readwrite");
    tx.objectStore("archive").put(memories, "memories");
    tx.oncomplete = () => {
      resolve();
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
    tx.onabort = () => {
      reject(tx.error);
      db.close();
    };
  });
}
export type Keepsake = {
  id: string;
  title: string;
  kind: string;
  note: string;
  image?: string;
};
export async function loadCollection(): Promise<Keepsake[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const r = db
      .transaction("archive", "readonly")
      .objectStore("archive")
      .get("collection");
    r.onsuccess = () => {
      resolve(r.result || []);
      db.close();
    };
    r.onerror = () => {
      reject(r.error);
      db.close();
    };
  });
}
export async function storeCollection(collection: Keepsake[]): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("archive", "readwrite");
    tx.objectStore("archive").put(collection, "collection");
    tx.oncomplete = () => {
      resolve();
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
    tx.onabort = () => {
      reject(tx.error);
      db.close();
    };
  });
}
