import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
    src: string;
    alt?: string;
    className?: string;
    placeholderColor?: string;
    threshold?: number;
}

const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt = '',
    className = '',
    placeholderColor = '#f3f4f6', // uil-gray-100
    threshold = 0.1,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                root: null, // viewport
                rootMargin: '50px', // load just before it comes into view
                threshold: threshold,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [threshold]);

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                backgroundColor: placeholderColor,
                // If we don't have an explicit aspect ratio container elsewhere, 
                // this div will rely on the content (img) to size it, 
                // or the parent to set a fixed size.
                // For masonry, usually the width is fixed (by column) and height is auto.
                // To avoid layout shift, often we need aspect ratio, but here prompt entries might vary.
                // We'll rely on the parent or the loaded image for final height, 
                // but the placeholder helps.
                minHeight: '200px', // Minimum height to prevent total collapse before load
            }}
        >
            {/* SVG Placeholder Pattern (Subtle) */}
            {!isLoaded && (
                <svg
                    className="absolute inset-0 w-full h-full text-gray-200 animate-pulse"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <rect width="100%" height="100%" fill={placeholderColor} />
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        className="opacity-20 transform scale-50"
                    />
                </svg>
            )}

            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    onLoad={() => setIsLoaded(true)}
                />
            )}
        </div>
    );
};

export default LazyImage;
