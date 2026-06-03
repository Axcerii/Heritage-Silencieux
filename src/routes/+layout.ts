import { getSession } from '$lib/auth-client';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async () => {
    const session = await getSession();
    return {
        session
    };
};
