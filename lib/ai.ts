// Web Worker interface for background AI processing with Lifecycle Management
let worker: Worker | null = null;
let killTimer: any = null;
const pendingRequests = new Map<string, (vec: number[] | null) => void>();

/**
 * Wake up the Brain: Boots the worker if it's dead, and resets the kill timer.
 */
export function wakeUpBrain(tier: string = 'balanced') {
    if (typeof window === 'undefined') return;

    // Clear any existing sleep timer
    if (killTimer) {
        clearTimeout(killTimer);
        killTimer = null;
    }

    if (!worker) {
        console.log("⚡ [AI] Booting up Brain Worker...");
        worker = new Worker(new URL('./ai.worker.ts', import.meta.url));
        worker.onmessage = (event) => {
            const { type, embedding, id } = event.data;
            const resolve = pendingRequests.get(id);
            if (resolve) {
                if (type === 'EMBEDDING_RESULT') {
                    resolve(embedding);
                } else {
                    resolve(null);
                }
                pendingRequests.delete(id);
            }
            // Reset sleep timer after activity
            scheduleSleep();
        };
    }
}

/**
 * Schedule Sleep: Kills the worker after 2 minutes of idle time to save battery.
 */
function scheduleSleep() {
    if (killTimer) clearTimeout(killTimer);
    killTimer = setTimeout(() => {
        if (worker) {
            console.log("💤 [AI] Brain going to sleep to save battery.");
            worker.terminate();
            worker = null;
        }
    }, 1000 * 60 * 2); // 2 minute idle timeout
}

export async function generateEmbedding(text: string, tier: string = 'balanced'): Promise<number[] | null> {
    wakeUpBrain(tier);
    if (!worker) return null;

    const id = Math.random().toString(36).substring(7);
    return new Promise((resolve) => {
        pendingRequests.set(id, resolve);
        worker!.postMessage({ type: 'GENERATE_EMBEDDING', text, id, tier });
    });
}

/**
 * Cold Boot: Warm up the worker when the CPU is idle, 
 * but don't rush it if the user is busy.
 */
export function warmUpBrain() {
    if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
        (window as any).requestIdleCallback(() => {
            console.log("🧊 [AI] Performance: Warming up brain during idle period...");
            wakeUpBrain();
            scheduleSleep(); // Sleep immediately if not used
        });
    }
}

export function cosineSimilarity(vecA: number[], vecB: number[]) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dot / magnitude;
}
