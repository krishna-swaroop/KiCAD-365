import React from 'react';
import { Folder } from 'lucide-react';
import { SectionHeader } from './ui';
import { FileTree } from './FileTree';

export const FileBrowserView = ({ activeTab, tabs, projectFiles, onPreview, projectId }) => {
    if (!activeTab) return null;

    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <div className="h-full p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <SectionHeader
                    title={currentTab?.label || activeTab}
                    icon={Folder}
                    rightElement={
                        <span className="text-[10px] text-gray-500 font-mono">
                            /{activeTab}
                        </span>
                    }
                />

                <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    {!projectFiles[activeTab] || projectFiles[activeTab].length === 0 ? (
                        <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                            <Folder size={48} className="mb-4 opacity-20" strokeWidth={1} />
                            <p className="text-xs uppercase tracking-widest font-bold">Directory Empty</p>
                            <p className="text-[10px] mt-2 max-w-xs text-center">Run "Sync & Build" to generate outputs.</p>
                        </div>
                    ) : (
                        <div className="p-4">
                            <FileTree
                                items={projectFiles[activeTab]}
                                onPreview={onPreview}
                                projectId={projectId}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
