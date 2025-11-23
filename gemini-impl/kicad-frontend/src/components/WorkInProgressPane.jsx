import React from 'react';
import { Construction, Download } from 'lucide-react';
import { Button } from './ui';

export const WorkInProgressPane = ({ title, downloadUrl, fileType }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
            <Construction className="text-yellow-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title} Viewer</h3>
            <p className="text-gray-600 mb-6 max-w-md">
                Interactive {fileType} viewing is coming soon! For now, you can download the
                generated outputs or view them in KiCAD.
            </p>
            <div className="flex gap-3">
                {downloadUrl && (
                    <a href={downloadUrl} download>
                        <Button variant="secondary">
                            <Download size={16} className="mr-2" />
                            Download {fileType}
                        </Button>
                    </a>
                )}
                <Button variant="primary" className="!bg-gray-300 !text-gray-500 cursor-not-allowed" disabled>
                    KiCanvas Integration Coming Soon
                </Button>
            </div>
        </div>
    );
};
