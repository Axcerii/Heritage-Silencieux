let isOpen = $state(true);

export const sidebarState = {
    get isOpen() {
        return isOpen;
    },
    set isOpen(value: boolean) {
        isOpen = value;
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar_open', value ? 'true' : 'false');
        }
    },
    init() {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sidebar_open');
            if (stored !== null) {
                isOpen = stored === 'true';
            }
        }
    }
};
