import React, { useEffect, useRef } from 'react';
import { Loader } from 'lucide-react';

export const PCBViewer = ({ fileUrl }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        // KiCanvas web component needs the full URL
        if (containerRef.current && fileUrl) {
            const embed = containerRef.current.querySelector('kicanvas-embed');
            if (embed) {
                // Force re-render when fileUrl changes
                embed.setAttribute('src', fileUrl);
            }
        }
    }, [fileUrl]);

    if (!fileUrl) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <Loader className="animate-spin mb-2" size={32} />
                <p className="text-sm">No PCB file found</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full w-full">
            <kicanvas-embed
                src={fileUrl}
                controls="full"
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
        </div>
    );
};
