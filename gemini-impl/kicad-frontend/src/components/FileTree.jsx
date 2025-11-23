import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Eye, Download } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8000/api`;

export const FileTree = ({ items, onPreview, projectId }) => {
    if (!items || items.length === 0) return null;

    return (
        <ul className="pl-0">
            {items.map((item, idx) => (
                <FileTreeNode
                    key={idx}
                    item={item}
                    onPreview={onPreview}
                    projectId={projectId}
                />
            ))}
        </ul>
    );
};

const FileTreeNode = ({ item, onPreview, projectId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isDirectory = item.type === 'directory';

    const toggleOpen = () => {
        if (isDirectory) setIsOpen(!isOpen);
    };

    // File Actions
    const lower = item.name.toLowerCase();
    const isPreviewable = lower.endsWith('.pdf') || lower.endsWith('.csv') || lower.endsWith('.md') || lower.endsWith('.html');
    const downloadUrl = `${API_BASE}/projects/${projectId}/file/${item.path}`;

    return (
        <li className="select-none">
            <div
                className={`group flex items-center justify-between p-2 hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-50 ${isDirectory ? 'font-bold' : ''}`}
                onClick={toggleOpen}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-gray-400 flex-shrink-0">
                        {isDirectory ? (
                            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : (
                            <div className="w-3.5" /> // Spacer for alignment
                        )}
                    </span>

                    <span className={`flex-shrink-0 ${isDirectory ? 'text-black' : 'text-gray-500'}`}>
                        {isDirectory ? <Folder size={14} /> : <File size={14} />}
                    </span>

                    <span className="text-xs font-mono truncate">{item.name}</span>
                </div>

                {!isDirectory && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPreviewable && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onPreview(item.path); }}
                                className="p-1 hover:bg-gray-200 rounded text-gray-600"
                                title="Preview"
                            >
                                <Eye size={12} />
                            </button>
                        )}
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 hover:bg-gray-200 rounded text-gray-600"
                            title="Download"
                        >
                            <Download size={12} />
                        </a>
                    </div>
                )}
            </div>

            {/* Recursive Children */}
            {isDirectory && isOpen && item.children && (
                <div className="pl-4 border-l border-gray-200 ml-2">
                    <FileTree items={item.children} onPreview={onPreview} projectId={projectId} />
                </div>
            )}
        </li>
    );
};
