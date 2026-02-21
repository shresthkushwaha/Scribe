
import { pipeline, env } from '@xenova/transformers';

// Configure for browser-side execution
env.allowLocalModels = false;
env.useBrowserCache = true;

// SINGLETON PATTERN to avoid reloading model
let extractor: any = null;

export async function getExtractor() {
    if (!extractor) {
        console.log("Creating Extractor Pipeline...");
        extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
            quantized: true,
        });
    }
    return extractor;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const pipe = await getExtractor();
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        // Convert Tensor to Array
        return Array.from(output.data);
    } catch (e) {
        console.error("Embedding Error", e);
        return null;
    }
}

export function cosineSimilarity(vecA: number[], vecB: number[]) {
    if (vecA.length !== vecB.length) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
