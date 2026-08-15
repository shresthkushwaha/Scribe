import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface V2Block {
  id: string;
  type: 'dataset' | 'lens';
  configId?: string; // for lenses
  name: string;
  x: number;
  y: number;
  data?: any; // Cached JSON graph for Micro view
  inputs?: string[]; // IDs of input blocks
  isDesynced?: boolean;
  isVibrating?: boolean;
  isHollow?: boolean;
  specialistType?: 'red-team' | 'gaps' | 'golden-path';
}

export interface V2Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type?: 'GAP_LINK' | 'SYNTHESIS' | 'DEFAULT';
  specialistType?: string;
}

export interface V2Workspace {
  id: string;
  name: string;
  blocks: V2Block[];
  connections: V2Connection[];
  oracleSessions?: any[]; // For storing GigaWorkbenchSession[]
  swampSessions?: any[]; // For storing SwampSession[]
  updatedAt: number;
}

interface ScribeV2DB extends DBSchema {
  workspaces: {
    key: string;
    value: V2Workspace;
    indexes: { 'by-updatedAt': number };
  };
}

let _db: IDBPDatabase<ScribeV2DB> | null = null;

async function getDB() {
  if (_db) return _db;
  _db = await openDB<ScribeV2DB>('scribe-v2', 1, {
    upgrade(db) {
      const store = db.createObjectStore('workspaces', { keyPath: 'id' });
      store.createIndex('by-updatedAt', 'updatedAt');
    },
  });
  return _db;
}

export async function saveWorkspace(workspace: V2Workspace): Promise<void> {
  const db = await getDB();
  await db.put('workspaces', { ...workspace, updatedAt: Date.now() });
}

export async function getWorkspace(id: string): Promise<V2Workspace | undefined> {
  const db = await getDB();
  return db.get('workspaces', id);
}

export async function getAllWorkspaces(): Promise<V2Workspace[]> {
  const db = await getDB();
  return db.getAllFromIndex('workspaces', 'by-updatedAt');
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('workspaces', id);
}
