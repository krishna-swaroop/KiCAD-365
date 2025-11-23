import React from 'react';
import { Cpu } from 'lucide-react';

export const ProjectSidebar = ({ tabs, activeTab, onTabChange }) => {
    return (
        <nav className="w-64 bg-white border-r border-black flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Project Files</div>
            </div>

            {/* Engineering View Button */}
            <button
                onClick={() => onTabChange(null)}
                className={`flex items-center justify-between p-4 text-xs font-bold uppercase border-b border-gray-100 transition-all
                    ${!activeTab ? 'bg-black text-white' : 'hover:bg-gray-100 text-black'}
                `}
            >
                <div className="flex items-center gap-3">
                    <Cpu size={14} />
                    <span className="text-[10px]">Engineering View</span>
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${!activeTab ? 'bg-green-500' : 'bg-gray-300'}`} />
            </button>

            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const hasItems = tab.hasItems;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center justify-between p-4 text-xs font-bold uppercase border-b border-gray-100 transition-all
                            ${isActive ? 'bg-black text-white' : 'hover:bg-gray-100 text-black'}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <Icon size={14} />
                            <span className="text-[10px]">{tab.label}</span>
                        </div>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasItems ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </button>
                );
            })}
        </nav>
    );
};
