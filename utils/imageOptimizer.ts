
/**
 * Optimizes Supabase Storage image URLs by appending transformation parameters.
 * Reference: https://supabase.com/docs/guides/storage/serving/image-transformations
 * 
 * @param url The original image URL
 * @param width The desired width of the image
 * @returns The optimized URL with query parameters
 */
export const getOptimizedImageUrl = (url: string | null | undefined, width: number): string => {
    if (!url) return '';

    // Basic check to see if it's likely a Supabase URL or supports our params.
    // We can be more specific if needed, but for now we assume app-controlled URLs are Supabase.
    // If it's an external URL (e.g. from a different provider), adding params might not hurt but might not work.
    // A safe bet is to check for 'supabase' in the domain or just append if it looks like a file path.
    // For Vibe Coding Prompt Library, we assume images are on Supabase.

    try {
        const urlObj = new URL(url);

        // Check if it's a Supabase Storage URL to be safe, or just apply blindly if it's our policy.
        // Generally, adding extra query params to unknown URLs is ignored, so it's relatively safe.

        urlObj.searchParams.set('width', width.toString());
        urlObj.searchParams.set('format', 'webp');
        urlObj.searchParams.set('quality', '80');
        urlObj.searchParams.set('resize', 'contain');

        return urlObj.toString();
    } catch (e) {
        // If URL parsing fails, return original
        return url;
    }
};
