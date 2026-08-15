export type DeviceTier = 'dream' | 'balanced' | 'potato';

export interface HardwareStats {
    tier: DeviceTier;
    cores: number;
    memory: number; // in GB
    gpu: boolean;
}

export async function analyzeDevice(): Promise<HardwareStats> {
    if (typeof window === 'undefined') {
        return { tier: 'balanced', cores: 4, memory: 4, gpu: false };
    }

    // 1. Get CPU Cores (logical processors)
    const cores = navigator.hardwareConcurrency || 2;

    // 2. Get RAM (Approximation)
    // deviceMemory is Chrome-only, default to 4GB if missing
    const memory = (navigator as any).deviceMemory || 4;

    // 3. Detect GPU (Check for WebGPU as a proxy for high-end acceleration)
    const gpu = await checkGPU();

    // 4. Decide Tier
    // DREAM: 8+ cores, 8GB+ RAM, and WebGPU support
    if (cores >= 8 && memory >= 8 && gpu) {
        return { tier: 'dream', cores, memory, gpu };
    }

    // POTATO: Low cores or low RAM
    if (cores <= 2 || memory <= 2) {
        return { tier: 'potato', cores, memory, gpu };
    }

    // BALANCED: Everything in between
    return { tier: 'balanced', cores, memory, gpu };
}

async function checkGPU(): Promise<boolean> {
    if (typeof navigator === 'undefined') return false;

    // Try to request a WebGPU adapter (Success = Potentially High End GPU)
    if ('gpu' in navigator) {
        try {
            const adapter = await (navigator as any).gpu.requestAdapter();
            return !!adapter;
        } catch (e) {
            return false;
        }
    }
    return false;
}
