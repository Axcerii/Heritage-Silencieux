import { page } from '$app/state';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

let customItems = $state<BreadcrumbItem[] | null>(null);

export const breadcrumbs = {
    get items(): BreadcrumbItem[] {
        if (customItems) return customItems;
        
        // Dynamic fallback based on current pathname
        const path = page.url.pathname;
        if (path === '/') {
            return [{ label: 'Cercles' }];
        }
        if (path.startsWith('/admin')) {
            return [{ label: 'Cercles', href: '/' }, { label: 'Administration' }];
        }
        
        // Parse clubs paths: /clubs/[clubSlug]/books/[bookId]/...
        const parts = path.split('/').filter(Boolean);
        const result: BreadcrumbItem[] = [{ label: 'Cercles', href: '/' }];
        
        if (parts[0] === 'clubs' && parts[1]) {
            const clubSlug = parts[1];
            result.push({ label: 'Cercle', href: `/clubs/${clubSlug}` });
            
            if (parts[2] === 'books' && parts[3]) {
                const bookId = parts[3];
                result.push({ label: 'Grimoire', href: `/clubs/${clubSlug}/books/${bookId}` });
                
                if (parts[4] === 'read' && parts[5]) {
                    result.push({ label: `Chapitre ${parts[5]}` });
                } else if (parts[4] === 'write') {
                    result.push({ label: 'Écrire' });
                }
            }
        }
        return result;
    },
    set(newItems: BreadcrumbItem[] | null) {
        customItems = newItems;
    }
};
