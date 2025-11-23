import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { SectionHeader } from './ui';
import { WorkInProgressPane } from './WorkInProgressPane';
import { PCBViewer } from './PCBViewer';
import { SchematicViewer } from './SchematicViewer';

export const EngineeringView = ({
    projectName,
    schematicUrl,
    pcbUrl,

    schematicPath,
    pcbPath,
    schematicFiles = [],
    pcbFiles = [],
    setSelectedSchematic,
    setSelectedPcb,
}) => {
    const [viewMode, setViewMode] = useState('schematic'); // 'schematic' | 'pcb' | '3d'

    const renderHeader = () => {
        const label = viewMode === 'schematic' ? 'Schematic Source' : viewMode === 'pcb' ? 'PCB Layout File' : '3D Model Source';
        return (
            <div className="flex items-center justify-between bg-gray-100 text-black px-4 py-2 border-b border-gray-300 font-mono text-xs">
                <span className="uppercase tracking-wider font-bold text-gray-500">{label}</span>
                {viewMode === 'schematic' && (
                    <select
                        className="bg-white border border-gray-300 text-black text-xs rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                        value={schematicPath || ''}
                        onChange={e => setSelectedSchematic && setSelectedSchematic(e.target.value)}
                    >
                        <option value="">-- Select Schematic --</option>
                        {schematicFiles.map(f => (
                            <option key={f.path} value={f.path}>{f.name}</option>
                        ))}
                    </select>
                )}
                {viewMode === 'pcb' && (
                    <select
                        className="bg-white border border-gray-300 text-black text-xs rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                        value={pcbPath || ''}
                        onChange={e => setSelectedPcb && setSelectedPcb(e.target.value)}
                    >
                        <option value="">-- Select PCB --</option>
                        {pcbFiles.map(f => (
                            <option key={f.path} value={f.path}>{f.name}</option>
                        ))}
                    </select>
                )}
            </div>
        );
    };

    const renderViewer = () => {
        if (viewMode === 'schematic') {
            return <SchematicViewer key={schematicUrl} fileUrl={schematicUrl} />;
        }
        if (viewMode === 'pcb') {
            return <PCBViewer key={pcbUrl} fileUrl={pcbUrl} />;
        }
        return (
            <WorkInProgressPane
                title="3D Model Viewer"
                fileType="STEP / WRL"
            />
        );
    };

    return (
        <div className="h-full flex flex-col bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="p-4 pb-0">
                <SectionHeader
                    title={`Engineering View`}
                    icon={Cpu}
                    rightElement={
                        <div className="flex items-center gap-6">
                            {/* Toggle Switch moved to Header Level */}
                            <div className="flex items-center bg-gray-100 p-1 rounded-sm border border-gray-200">
                                <button
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${viewMode === 'schematic' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                                    onClick={() => setViewMode('schematic')}
                                >
                                    Schematic
                                </button>
                                <button
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${viewMode === 'pcb' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                                    onClick={() => setViewMode('pcb')}
                                >
                                    PCB
                                </button>
                                <button
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${viewMode === '3d' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                                    onClick={() => setViewMode('3d')}
                                >
                                    3D Model
                                </button>
                            </div>

                            <span className="text-[10px] text-gray-500 font-mono border-l border-gray-300 pl-4 h-6 flex items-center">
                                {projectName}
                            </span>
                        </div>
                    }
                />
            </div>

            {/* Sub-Header with Dropdowns */}
            {renderHeader()}

            {/* Viewer area */}
            <div className="flex-1 overflow-hidden bg-[#F4F4F4] min-h-[500px]">
                {renderViewer()}
            </div>
        </div>
    );
};
