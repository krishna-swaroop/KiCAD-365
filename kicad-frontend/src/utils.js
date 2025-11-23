import { Cpu, Hammer, BookOpen, Activity, Terminal, Box, Layers, Folder } from 'lucide-react';

export const getIconForName = (name) => {
    const n = name.toLowerCase();
    if (n.includes('design') || n.includes('schematic')) return Cpu;
    if (n.includes('manufact') || n.includes('gerber') || n.includes('fab')) return Hammer;
    if (n.includes('doc') || n.includes('read') || n.includes('spec')) return BookOpen;
    if (n.includes('sim') || n.includes('test')) return Activity;
    if (n.includes('firmware') || n.includes('code') || n.includes('sw')) return Terminal;
    if (n.includes('mech') || n.includes('3d')) return Box;
    if (n.includes('layer')) return Layers;
    return Folder;
};

export const resolveRelativePath = (currentFile, relativePath) => {
    if (!relativePath) return relativePath;

    // If it's an external URL, return as is
    if (relativePath.startsWith('http') || relativePath.startsWith('//')) {
        return relativePath;
    }

    // If it starts with /, treat it as relative to the project root (remove /)
    if (relativePath.startsWith('/')) {
        return relativePath.substring(1);
    }

    let cleanRelative = relativePath;
    if (cleanRelative.startsWith('./')) {
        cleanRelative = cleanRelative.substring(2);
    }

    const lastSlashIndex = currentFile.lastIndexOf('/');
    const baseDir = lastSlashIndex !== -1 ? currentFile.substring(0, lastSlashIndex) : '';

    const stack = baseDir ? baseDir.split('/') : [];
    const validStack = stack.filter(s => s.length > 0);

    const parts = cleanRelative.split('/');
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === '.') continue;
        if (part === '..') {
            if (validStack.length > 0) validStack.pop();
        } else {
            validStack.push(part);
        }
    }

    return validStack.join('/');
};

export const parseCSV = (text) => {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentCell);
            if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }
    return rows;
};
