// place files you want to import through the `$lib` alias in this folder.

export function censorEmail(email: string): string {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    if (localPart.length <= 1) {
        return `${localPart}@${domain}`;
    }
    if (localPart.length <= 3) {
        return `${localPart[0]}*@${domain}`;
    }
    if (localPart.length <= 5) {
        return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
    }
    const showEndCount = Math.min(3, Math.max(1, localPart.length - 4));
    const startChar = localPart[0];
    const endChars = localPart.slice(-showEndCount);
    return `${startChar}***${endChars}@${domain}`;
}

import { BACKEND_BASE } from './api';

export function getImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    return `${BACKEND_BASE}${imagePath}`;
}

const DRAGONS = [
    { name: 'Aqua', isLight: true, svgClass: 'Aqua-svg' },
    { name: 'Artrish', isLight: true, svgClass: 'Artrish-svg' },
    { name: 'Chronos', isLight: false, svgClass: 'Chronos-svg' },
    { name: 'Drii', isLight: false, svgClass: 'Drii-svg' },
    { name: 'Goliath', isLight: false, svgClass: 'Goliath-svg' },
    { name: 'Guizamark', isLight: true, svgClass: 'Guizamark-svg' },
    { name: 'Lada', isLight: true, svgClass: 'Lada-svg' },
    { name: 'Pestia', isLight: false, svgClass: 'Pestia-svg' },
    { name: 'Pura', isLight: true, svgClass: 'Pura-svg' },
    { name: 'Shizari', isLight: false, svgClass: 'Shizari-svg' },
    { name: 'Yinva', isLight: true, svgClass: 'Yinva-svg' }
];

export interface DragonAvatar {
    name: string;
    logo: string;
    svgClass: string;
    bgClass: string;
}

export function getUserAvatarDragon(seed: string | null | undefined): DragonAvatar {
    const defaultDragon = {
        name: 'Guizamark',
        logo: '/dragons_logos/tampons/Guizamark.svg',
        svgClass: 'Guizamark-svg',
        bgClass: 'bg-background'
    };
    if (!seed) return defaultDragon;

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % DRAGONS.length;
    const dragon = DRAGONS[index];

    return {
        name: dragon.name,
        logo: `/dragons_logos/tampons/${dragon.name}.svg`,
        svgClass: dragon.svgClass,
        bgClass: dragon.isLight ? 'bg-background' : 'bg-foreground'
    };
}

