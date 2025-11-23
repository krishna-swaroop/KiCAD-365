import React from 'react';
import { Cpu } from 'lucide-react';
import { SectionHeader } from './ui';
// import { ThreeDViewer } from './ThreeDViewer'; // Temporarily disabled due to React 19 incompatibility
import { WorkInProgressPane } from './WorkInProgressPane';

export const EngineeringView = ({ projectName, schematicUrl, pcbUrl, model3DUrl }) => {
    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-black bg-gray-50 px-6 py-4">
                <SectionHeader icon={Cpu} title={`Engineering View: ${projectName}`} />
            </div>

            {/* 3-Pane Layout */}
            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-0 border-l border-black">
                {/* Top Left: Schematic */}
                <div className="border-r border-b border-black relative">
                    <div className="absolute top-0 left-0 right-0 z-10 bg-gray-900 text-white px-4 py-2 border-b border-gray-700">
                        <span className="font-mono text-xs uppercase tracking-wider">Schematic</span>
                    </div>
                    <div className="h-full pt-10">
                        <WorkInProgressPane
                            title="Schematic"
                            downloadUrl={schematicUrl}
                            fileType="Schematic PDF"
                        />
                    </div>
                </div>

                {/* Top Right: PCB */}
                <div className="border-b border-black relative">
                    <div className="absolute top-0 left-0 right-0 z-10 bg-gray-900 text-white px-4 py-2 border-b border-gray-700">
                        <span className="font-mono text-xs uppercase tracking-wider">PCB Layout</span>
                    </div>
                    <div className="h-full pt-10">
                        <WorkInProgressPane
                            title="PCB"
                            downloadUrl={pcbUrl}
                            fileType="PCB PDF"
                        />
                    </div>
                </div>

                {/* Bottom: 3D Model (spans both columns) */}
                <div className="col-span-2 relative">
                    <div className="absolute top-0 left-0 right-0 z-10 bg-gray-900 text-white px-4 py-2 border-b border-gray-700">
                        <span className="font-mono text-xs uppercase tracking-wider">3D Model</span>
                    </div>
                    <div className="h-full pt-10">
                        <WorkInProgressPane
                            title="3D Model"
                            downloadUrl={model3DUrl}
                            fileType="3D STEP"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
