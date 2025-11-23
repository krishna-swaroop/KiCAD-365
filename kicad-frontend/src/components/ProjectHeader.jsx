import React from 'react';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from './ui';

export const ProjectHeader = ({ project, onBack, onSyncAndBuild, isSyncing }) => {
    return (
        <header className="bg-white border-b border-black px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-6">
                <Button variant="ghost" onClick={onBack} className="!px-0 hover:!bg-transparent">
                    <ArrowLeft size={16} /> <span className="underline decoration-1 underline-offset-4">BACK TO GALLERY</span>
                </Button>
                <div className="h-8 w-px bg-gray-300" />
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-tighter leading-none">{project.name}</h1>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">ID: {project.id}</p>
                </div>
            </div>
            <Button onClick={onSyncAndBuild} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                {isSyncing ? "PROCESSING..." : "SYNC & BUILD"}
            </Button>
        </header>
    );
};
