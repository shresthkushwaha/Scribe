import { create } from 'zustand';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type MapType = 'individual' | 'multi' | 'oracle' | 'strategist' | 'swamp' | 'custom' | 'v2';

export interface SavedMap {
  id: string;
  title: string;
  type: MapType;
  noteIds: string[];
  noteTitles?: string[];
  nodeCount: number;
  linkCount: number;
  previewExcerpt?: string;
  href: string;
  createdAt: number;
  updatedAt: number;
}

interface ScribeMapsDB extends DBSchema {
  maps: {
    key: string;
    value: SavedMap;
    indexes: { 'by-updatedAt': number };
  };
}

let _db: IDBPDatabase<ScribeMapsDB> | null = null;

async function getDB() {
  if (typeof window === 'undefined') return null;
  if (_db) return _db;
  _db = await openDB<ScribeMapsDB>('scribe-maps', 1, {
    upgrade(db) {
      const store = db.createObjectStore('maps', { keyPath: 'id' });
      store.createIndex('by-updatedAt', 'updatedAt');
    },
  });
  return _db;
}

export async function getAllSavedMaps(): Promise<SavedMap[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAllFromIndex('maps', 'by-updatedAt');
  return all.reverse(); // Newest first
}

export async function getSavedMap(id: string): Promise<SavedMap | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  return db.get('maps', id);
}

export async function saveMapToDB(map: SavedMap): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put('maps', map);
}

export async function deleteMapFromDB(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete('maps', id);
}

interface MapStore {
  maps: SavedMap[];
  loaded: boolean;
  load: () => Promise<void>;
  saveMap: (map: SavedMap) => Promise<void>;
  recordMap: (mapData: Omit<SavedMap, 'createdAt' | 'updatedAt'> & { createdAt?: number; updatedAt?: number }) => Promise<void>;
  deleteMap: (id: string) => Promise<void>;
}

export const useMapStore = create<MapStore>((set, get) => ({
  maps: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const maps = await getAllSavedMaps();
    set({ maps, loaded: true });
  },

  saveMap: async (map: SavedMap) => {
    await saveMapToDB(map);
    const maps = await getAllSavedMaps();
    set({ maps });
  },

  recordMap: async (mapData) => {
    const now = Date.now();
    const existing = await getSavedMap(mapData.id);
    const mapToSave: SavedMap = {
      ...mapData,
      createdAt: existing ? existing.createdAt : (mapData.createdAt || now),
      updatedAt: now,
    };
    await saveMapToDB(mapToSave);
    const maps = await getAllSavedMaps();
    set({ maps, loaded: true });
  },

  deleteMap: async (id: string) => {
    await deleteMapFromDB(id);
    set((state) => ({ maps: state.maps.filter((m) => m.id !== id) }));
  },
}));
