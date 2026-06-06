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
