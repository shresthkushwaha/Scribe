import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Note {
    id: string;
    title: string;
    body: string;        // raw markdown
    tags: string[];      // manual tags
    autoTags: string[];  // extracted by Scribe engine
    createdAt: number;
    updatedAt: number;
    starred?: boolean;
    archived?: boolean;
    trashed?: boolean;
    color?: string;
}

interface ScribeDB extends DBSchema {
    notes: {
        key: string;
        value: Note;
        indexes: { 'by-updatedAt': number };
    };
}

let _db: IDBPDatabase<ScribeDB> | null = null;

async function getDB() {
    if (_db) return _db;
    _db = await openDB<ScribeDB>('scribe-notes', 1, {
        upgrade(db) {
            const store = db.createObjectStore('notes', { keyPath: 'id' });
            store.createIndex('by-updatedAt', 'updatedAt');
        },
    });
    return _db;
}

export async function getAllNotes(): Promise<Note[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex('notes', 'by-updatedAt');
    return all.reverse(); // newest first
}

export async function getNote(id: string): Promise<Note | undefined> {
    const db = await getDB();
    return db.get('notes', id);
}

export async function saveNote(note: Note): Promise<void> {
    const db = await getDB();
    await db.put('notes', note);
}

export async function deleteNote(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('notes', id);
}
