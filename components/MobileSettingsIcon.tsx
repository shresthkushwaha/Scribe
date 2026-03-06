'use client';

import Link from 'next/link';
import { GearSix } from '@phosphor-icons/react';

export function MobileSettingsIcon() {
    return (
        <Link
            href="/settings"
            className="md:hidden p-2 rounded-full hover:bg-[var(--bg-muted)] transition-colors text-[var(--ink)] opacity-60 hover:opacity-100"
            aria-label="Settings"
        >
            <GearSix size={24} weight="regular" />
        </Link>
    );
}
