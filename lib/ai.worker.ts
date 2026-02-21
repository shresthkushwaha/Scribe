import { pipeline, env } from '@xenova/transformers';

// Configure for offline brain
env.allowLocalModels = false;
env.useBrowserCache = true;

let extractor: any = null;
let currentTier: string = 'balanced';

async function getExtractor(tier: string) {
    if (!extractor || currentTier !== tier) {
        currentTier = tier;
        console.log(`⚡ [Worker] Creating Extractor Pipeline (Tier: ${tier})...`);

        // POTATO MODE: Minimal or NO AI. 
        // We handle this by returning null or a tiny model.
        if (tier === 'potato') {
            return null;
        }

        const isQuantized = tier === 'balanced' || tier === 'potato';
        const device = tier === 'dream' ? 'webgpu' : 'wasm';

        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: isQuantized,
            device: device,
        } as any);
    }
    return extractor;
}

self.onmessage = async (event) => {
    const { type, text, id, tier = 'balanced' } = event.data;

    if (type === 'GENERATE_EMBEDDING') {
        try {
            const pipe = await getExtractor(tier);
            if (!pipe) {
                self.postMessage({ type: 'EMBEDDING_RESULT', embedding: null, id });
                return;
            }
            const output = await pipe(text, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);
            self.postMessage({ type: 'EMBEDDING_RESULT', embedding, id });
        } catch (error) {
            console.error("[Worker] Embedding Error:", error);
            self.postMessage({ type: 'EMBEDDING_ERROR', error: String(error), id });
        }
    }
};
