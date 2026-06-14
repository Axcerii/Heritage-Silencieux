import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
    return {
        clubSlug: params.clubSlug,
        bookSlug: params.bookSlug,
        chapterIndex: Number(params.chapterIndex)
    };
};
