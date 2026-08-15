'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { analyzeDevice, type DeviceTier } from '@/lib/hardware';

const HardwareContext = createContext<DeviceTier>('balanced');

export function HardwareProvider({ children }: { children: React.ReactNode }) {
    const [tier, setTier] = useState<DeviceTier>('balanced');

    useEffect(() => {
        console.log("🖥️ [Hardware] HardwareProvider Mounted. Starting detection...");
        const detect = async () => {
            try {
                const stats = await analyzeDevice();
                console.log("🖥️ [Hardware] Detection Result (SUCCESS):", stats);
                setTier(stats.tier);
            } catch (e) {
                console.error("🖥️ [Hardware] Detection FAILED:", e);
            }
        };
        detect();
    }, []);

    return (
        <HardwareContext.Provider value={tier}>
            {children}
        </HardwareContext.Provider>
    );
}

export const useTier = () => useContext(HardwareContext);
