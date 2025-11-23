import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { File, FileText, Table as TableIcon, FileCode, X } from 'lucide-react';
import { Button } from './ui';
import { resolveRelativePath, parseCSV } from '../utils';

export const MarkdownViewer = ({ content, baseFileUrl, currentFilePath }) => {
    return (
        <div className="p-8 max-w-5xl mx-auto bg-white min-h-full">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold pb-4 mb-6 border-b-2 border-black mt-2 font-mono uppercase tracking-tight" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold pb-2 mb-4 border-b border-black mt-8 font-mono uppercase tracking-widest" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 mt-6 font-mono uppercase border-b border-gray-200 pb-1 inline-block" {...props} />,
                    h4: ({ node, ...props }) => <h4 className="text-base font-bold mb-2 mt-4 font-mono uppercase text-gray-700" {...props} />,
                    p: ({ node, ...props }) => <div className="mb-4 leading-relaxed font-mono text-sm text-gray-800" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 pl-4 font-mono text-sm" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 pl-4 font-mono text-sm" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    a: ({ node, ...props }) => <a className="text-blue-600 hover:underline font-mono font-bold" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-black pl-4 py-2 mb-4 text-gray-600 bg-gray-50 font-mono italic" {...props} />,
                    code: ({ node, inline, className, children, ...props }) => {
                        if (inline) {
                            return <code className="bg-gray-100 px-1.5 py-0.5 text-xs font-mono border border-gray-300 text-red-600 rounded-sm" {...props}>{children}</code>;
                        }
                        return (
                            <pre className="bg-black text-white p-4 mb-4 overflow-x-auto border border-black text-xs font-mono mt-2">
                                <code {...props}>{children}</code>
                            </pre>
                        );
                    },
                    table: ({ node, ...props }) => <div className="overflow-x-auto mb-6"><table className="w-full border-collapse text-sm font-mono border border-black" {...props} /></div>,
                    thead: ({ node, ...props }) => <thead className="bg-black text-white" {...props} />,
                    th: ({ node, ...props }) => <th className="border border-black p-3 font-bold text-left uppercase tracking-wider" {...props} />,
                    td: ({ node, ...props }) => <td className="border border-black p-2 align-top text-gray-800" {...props} />,
                    hr: ({ node, ...props }) => <hr className="my-8 border-t-2 border-black" {...props} />,
                    img: ({ node, ...props }) => {
                        let src = props.src;
                        if (src && !src.startsWith('http') && !src.startsWith('https') && !src.startsWith('//')) {
                            const resolvedPath = resolveRelativePath(currentFilePath, src);
                            src = `${baseFileUrl}/${resolvedPath}`;
                        }
                        return <img className="max-w-full h-auto border border-black my-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" {...props} src={src} alt={props.alt || "image"} />;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export const CsvViewer = ({ content }) => {
    if (!content) return <div>Loading...</div>;
    const rows = parseCSV(content);
    if (rows.length === 0) return <div>Empty CSV</div>;
    const headers = rows[0];
    const data = rows.slice(1);
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono bg-white">
                <thead>
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="border border-black bg-black text-white p-3 font-bold uppercase whitespace-nowrap sticky top-0">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-100 transition-colors">
                            {row.map((cell, j) => (
                                <td key={j} className="border border-gray-300 p-2 min-w-[100px] max-w-[300px] break-words align-top">
                                    {cell.length > 50 && cell.includes(',') ? cell.split(',').join(', ') : cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const PreviewModal = ({ file, onClose, baseFileUrl }) => {
    const name = file.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    const isCsv = name.endsWith('.csv');
    const isMd = name.endsWith('.md');
    const isHtml = name.endsWith('.html');

    let HeaderIcon = File;
    if (isPdf) HeaderIcon = FileText;
    if (isCsv) HeaderIcon = TableIcon;
    if (isMd) HeaderIcon = FileCode;
    if (isHtml) HeaderIcon = FileCode;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8">
            <div className="bg-white w-full max-w-[95vw] h-[95vh] flex flex-col border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-slide-in">
                <div className="flex justify-between items-center p-4 border-b border-black bg-gray-50">
                    <div className="flex items-center gap-3">
                        <HeaderIcon size={20} />
                        <div>
                            <h3 className="text-sm font-bold uppercase font-mono">{file.name.split('/').pop()}</h3>
                            <p className="text-[10px] text-gray-500 font-mono tracking-widest">{file.name}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <a href={file.url} download>
                            <Button variant="secondary" className="!py-1.5 !px-3">Download</Button>
                        </a>
                        <Button onClick={onClose} variant="primary" className="!py-1.5 !px-3"><X size={16} /></Button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-white p-0">
                    {(isPdf || isHtml) && (
                        <iframe src={file.url} className="w-full h-full border-none" title="File Viewer" />
                    )}
                    {isCsv && (
                        <div className="p-8">
                            <CsvViewer content={file.content} />
                        </div>
                    )}
                    {isMd && (
                        <div className="bg-white min-h-full">
                            <MarkdownViewer content={file.content} baseFileUrl={baseFileUrl} currentFilePath={file.name} />
                        </div>
                    )}
                    {!isPdf && !isCsv && !isMd && !isHtml && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Preview not available for this file type.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
