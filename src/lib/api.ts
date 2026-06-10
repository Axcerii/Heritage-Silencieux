export const BACKEND_BASE = 'http://localhost:3000';

export type DragonTheme = 'Aqua' | 'Artrish' | 'Chronos' | 'Drii' | 'Goliath' | 'Guizamark' | 'Lada' | 'Pestia' | 'Pura' | 'Shizari' | 'Yinva';

export interface Club {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    isPublic: boolean;
    theme?: DragonTheme;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    genre: string;
    pages: number;
    isActive: boolean;
    clubId: string;
    createdAt: string;
    updatedAt: string;
    averageRating: number | null;
    theme?: DragonTheme;
}

export interface ClubMember {
    userId: string;
    clubId: string;
    role: 'OWNER' | 'EDITOR' | 'READER';
    joinedAt: string;
    user: {
        id: string;
        email: string;
        name: string | null;
        image: string | null;
    };
}

export interface Chapter {
    id: string;
    index: number;
    title: string;
    content: string;
    bookId: string;
    createdAt: string;
    updatedAt: string;
    isRead?: boolean;
}

export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    userId: string;
    bookId: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

export interface Progression {
    id: string;
    userId: string;
    bookId: string;
    currentPage: number;
    createdAt: string;
    updatedAt: string;
}

export interface MemberProgression {
    userId: string;
    userName: string | null;
    userEmail: string;
    currentPage: number;
    progressPercentage: number;
    updatedAt: string | null;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BACKEND_BASE}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `API error: ${response.status}`);
    }

    // For file exports or content that isn't JSON
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
        return (await response.text()) as unknown as T;
    }

    return response.json();
}

// --- CLUBS ---
export function getClubs(): Promise<Club[]> {
    return apiRequest<Club[]>('/clubs');
}

export function getClubDetails(clubId: string): Promise<Club> {
    return apiRequest<Club>(`/clubs/${clubId}`);
}

export function createClub(name: string, slug?: string, isPublic?: boolean, theme?: DragonTheme): Promise<Club> {
    return apiRequest<Club>('/clubs', {
        method: 'POST',
        body: JSON.stringify({ name, slug, isPublic, theme })
    });
}

export function updateClub(clubId: string, data: { name?: string; slug?: string; isActive?: boolean; isPublic?: boolean; theme?: DragonTheme }): Promise<Club> {
    return apiRequest<Club>(`/clubs/${clubId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

export function deleteClub(clubId: string): Promise<Club> {
    return apiRequest<Club>(`/clubs/${clubId}`, {
        method: 'DELETE'
    });
}

// --- CLUB MEMBERS ---
export function getClubMembers(clubSlug: string): Promise<ClubMember[]> {
    return apiRequest<ClubMember[]>(`/clubs/${clubSlug}/members`);
}

export function addClubMember(clubSlug: string, email: string): Promise<any> {
    return apiRequest<any>(`/clubs/${clubSlug}/members`, {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

export function updateClubMemberRole(clubSlug: string, userId: string, role: 'OWNER' | 'EDITOR' | 'READER'): Promise<any> {
    return apiRequest<any>(`/clubs/${clubSlug}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    });
}

export function removeClubMember(clubSlug: string, userId: string): Promise<any> {
    return apiRequest<any>(`/clubs/${clubSlug}/members/${userId}`, {
        method: 'DELETE'
    });
}

// --- CLUB JOIN REQUESTS ---
export function joinClub(clubSlug: string): Promise<{ status: 'JOINED' | 'PENDING'; membership?: ClubMember }> {
    return apiRequest<{ status: 'JOINED' | 'PENDING'; membership?: ClubMember }>(`/clubs/${clubSlug}/join`, {
        method: 'POST'
    });
}

export function getJoinStatus(clubSlug: string): Promise<{ isMember: boolean; role: 'OWNER' | 'EDITOR' | 'READER' | null; hasPendingRequest: boolean }> {
    return apiRequest<{ isMember: boolean; role: 'OWNER' | 'EDITOR' | 'READER' | null; hasPendingRequest: boolean }>(`/clubs/${clubSlug}/join-status`);
}

export function getJoinRequests(clubSlug: string): Promise<any[]> {
    return apiRequest<any[]>(`/clubs/${clubSlug}/join-requests`);
}

export function approveJoinRequest(clubSlug: string, userId: string): Promise<any> {
    return apiRequest<any>(`/clubs/${clubSlug}/join-requests/${userId}/approve`, {
        method: 'POST'
    });
}

export function rejectJoinRequest(clubSlug: string, userId: string): Promise<any> {
    return apiRequest<any>(`/clubs/${clubSlug}/join-requests/${userId}/reject`, {
        method: 'POST'
    });
}

// --- BOOKS ---
export function getBooks(clubSlug: string): Promise<Book[]> {
    return apiRequest<Book[]>(`/clubs/${clubSlug}/books`);
}

export function getBookDetails(clubSlug: string, bookId: string): Promise<Book> {
    return apiRequest<Book>(`/clubs/${clubSlug}/books/${bookId}`);
}

export function createBook(clubSlug: string, data: { title: string; author: string; genre: string; pages?: number; theme?: DragonTheme }): Promise<Book> {
    return apiRequest<Book>(`/clubs/${clubSlug}/books`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export function updateBook(clubSlug: string, bookId: string, data: { title?: string; author?: string; genre?: string; pages?: number; isActive?: boolean; theme?: DragonTheme }): Promise<Book> {
    return apiRequest<Book>(`/clubs/${clubSlug}/books/${bookId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

export function deleteBook(clubSlug: string, bookId: string): Promise<Book> {
    return apiRequest<Book>(`/clubs/${clubSlug}/books/${bookId}`, {
        method: 'DELETE'
    });
}

export function exportLibraryCsv(clubSlug: string): Promise<string> {
    return apiRequest<string>(`/clubs/${clubSlug}/books/export`);
}

// --- CHAPTERS ---
export interface ChaptersResponse {
    data: Chapter[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function getChapters(clubSlug: string, bookId: string): Promise<ChaptersResponse> {
    return apiRequest<ChaptersResponse>(`/clubs/${clubSlug}/books/${bookId}/chapters`);
}

export function getChapter(clubSlug: string, bookId: string, index: number): Promise<Chapter> {
    return apiRequest<Chapter>(`/clubs/${clubSlug}/books/${bookId}/chapters/${index}`);
}

export function createChapter(clubSlug: string, bookId: string, data: { index: number; title: string; content: string }): Promise<Chapter> {
    return apiRequest<Chapter>(`/clubs/${clubSlug}/books/${bookId}/chapters`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export function updateChapter(clubSlug: string, bookId: string, index: number, data: { index?: number; title?: string; content?: string }): Promise<Chapter> {
    return apiRequest<Chapter>(`/clubs/${clubSlug}/books/${bookId}/chapters/${index}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

export function deleteChapter(clubSlug: string, bookId: string, index: number): Promise<any> {
    return apiRequest<any>(`/clubs/${clubSlug}/books/${bookId}/chapters/${index}`, {
        method: 'DELETE'
    });
}

export function toggleChapterRead(clubSlug: string, bookId: string, index: number, read: boolean): Promise<any> {
    return apiRequest<any>(`/clubs/${clubSlug}/books/${bookId}/chapters/${index}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ read })
    });
}

// --- PROGRESSION ---
export function getProgression(clubSlug: string, bookId: string): Promise<Progression | null> {
    return apiRequest<Progression | null>(`/clubs/${clubSlug}/books/${bookId}/progression`).catch(() => null);
}

export function updateProgression(clubSlug: string, bookId: string, currentPage: number): Promise<Progression> {
    return apiRequest<Progression>(`/clubs/${clubSlug}/books/${bookId}/progression`, {
        method: 'PATCH',
        body: JSON.stringify({ currentPage })
    });
}

export function getGlobalProgressions(clubSlug: string, bookId: string): Promise<MemberProgression[]> {
    return apiRequest<MemberProgression[]>(`/clubs/${clubSlug}/books/${bookId}/progressions`).catch(() => []);
}

export interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'USER';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// --- REVIEWS ---
export function getReviews(clubSlug: string, bookId: string): Promise<Review[]> {
    return apiRequest<Review[]>(`/clubs/${clubSlug}/books/${bookId}/reviews`);
}

export function createReview(clubSlug: string, bookId: string, rating: number, comment?: string): Promise<Review> {
    return apiRequest<Review>(`/clubs/${clubSlug}/books/${bookId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
    });
}

// --- ADMINISTRATION ---
export function getAdminUsers(): Promise<AdminUser[]> {
    return apiRequest<AdminUser[]>('/admin/users');
}

export function deactivateUser(userId: string): Promise<any> {
    return apiRequest<any>(`/admin/users/${userId}/deactivate`, {
        method: 'POST'
    });
}

export function reactivateUser(userId: string): Promise<any> {
    return apiRequest<any>(`/admin/users/${userId}/reactivate`, {
        method: 'POST'
    });
}

export function deleteReviewAdmin(reviewId: string): Promise<any> {
    return apiRequest<any>(`/admin/reviews/${reviewId}`, {
        method: 'DELETE'
    });
}

