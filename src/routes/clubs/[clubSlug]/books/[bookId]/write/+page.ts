import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
    return {
        clubSlug: params.clubSlug,
        bookId: params.bookId
    };
};
