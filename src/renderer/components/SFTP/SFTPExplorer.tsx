import React, { useEffect, useState } from 'react';
import { FileEditorModal } from '../FileEditorModal';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';
import { ArrowUp, ArrowDown, RefreshCw, File as FileIcon, Folder, Home, FileText, Image, Music, Video, Code, Archive } from 'lucide-react';

const ExplorerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  color: ${theme.colors.foreground};
  background-color: ${theme.colors.backgroundLighter};
  overflow: hidden;
`;

const Toolbar = styled.div`
    display: flex;
    gap: 8px;
    padding: ${theme.spacing.sm};
    border-bottom: 1px solid ${theme.colors.border};
    background-color: ${theme.colors.background};
    align-items: center;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    color: ${theme.colors.foreground};
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background-color: ${theme.colors.backgroundLighter};
        color: ${theme.colors.accent};
    }
`;

const BreadcrumbsContainer = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    background: ${theme.colors.backgroundDark};
    border: 1px solid ${theme.colors.border};
    border-radius: 4px;
    padding: 4px 8px;
    gap: 4px;
    overflow-x: auto;
    white-space: nowrap;

    &::-webkit-scrollbar { height: 0; }
`;

const BreadcrumbItem = styled.span<{ active?: boolean }>`
    font-size: 12px;
    color: ${props => props.active ? theme.colors.foreground : theme.colors.secondary};
    cursor: ${props => props.active ? 'default' : 'pointer'};
    display: flex;
    align-items: center;
    
    &:hover {
        color: ${props => props.active ? theme.colors.foreground : theme.colors.accent};
        text-decoration: ${props => props.active ? 'none' : 'underline'};
    }
`;

const Separator = styled.span`
    color: ${theme.colors.border};
    font-size: 10px;
    margin: 0 2px;
`;

const TableContainer = styled.div`
    flex: 1;
    overflow-y: auto;
`;

const FileList = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    
    th {
        text-align: left;
        padding: 8px;
        position: sticky;
        top: 0;
        background-color: ${theme.colors.background};
        border-bottom: 1px solid ${theme.colors.border};
        color: ${theme.colors.accent};
        font-weight: 600;
        z-index: 1;
    }
    
    td {
        padding: 6px 8px;
        border-bottom: 1px solid ${theme.colors.border}20; // Transparent border
        cursor: default;
        white-space: nowrap;
    }

    tr:hover td {
        background-color: ${theme.colors.primary}20; // 20% opacity primary
    }
`;

const FileRow = styled.tr<{ selected?: boolean }>`
    background-color: ${props => props.selected ? `${theme.colors.primary}40` : 'transparent'};
`;

const NameCell = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

interface FileEntry {
    name: string;
    longname: string;
    isDirectory: boolean;
    attributes: any;
}

interface SFTPExplorerProps {
    sessionData: any;
    isVisible: boolean;
}

const ContextMenu = styled.div<{ x: number, y: number }>`
    position: fixed;
    top: ${props => props.y}px;
    left: ${props => props.x}px;
    background: ${theme.colors.backgroundLighter};
    border: 1px solid ${theme.colors.border};
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    z-index: 1000;
    width: 150px;
    border-radius: 4px;
`;

const MenuItem = styled.div`
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    color: ${theme.colors.foreground};
    &:hover { background: ${theme.colors.primary}; color: ${theme.colors.background}; }
`;

// Styled Components for Spinner
const Spinner = styled.div`
  border: 2px solid ${theme.colors.backgroundLighter};
  border-top: 2px solid ${theme.colors.accent};
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin: 20px auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Helper for permissions color
const getPermColor = (mode: string) => {
    if (mode.startsWith('d')) return theme.colors.accent; // Directory
    if (mode.includes('x')) return '#50fa7b'; // Executable (Green-ish)
    return theme.colors.secondary;
};

const getFileIcon = (name: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder size={14} color={theme.colors.accent} fill={theme.colors.accent} fillOpacity={0.2} />;

    const ext = name.split('.').pop()?.toLowerCase();
    const color = theme.colors.foreground;

    switch (ext) {
        case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg':
            return <Image size={14} color="#bd93f9" />;
        case 'mp3': case 'wav': case 'ogg':
            return <Music size={14} color="#ff79c6" />;
        case 'mp4': case 'mkv': case 'mov':
            return <Video size={14} color="#ff79c6" />;
        case 'js': case 'ts': case 'tsx': case 'jsx': case 'json': case 'html': case 'css': case 'py': case 'java': case 'c': case 'cpp':
        case 'sh': case 'yaml': case 'md':
            return <Code size={14} color="#f1fa8c" />;
        case 'zip': case 'tar': case 'gz': case 'rar': case '7z':
            return <Archive size={14} color="#ffb86c" />;
        case 'txt': case 'log': case 'conf':
            return <FileText size={14} color="#8be9fd" />;
        default:
            return <FileIcon size={14} color={color} />;
    }
};

type SortField = 'name' | 'size';
type SortDirection = 'asc' | 'desc';

// Progress Bar Components
const Footer = styled.div`
    padding: 8px;
    border-top: 1px solid ${theme.colors.border};
    background-color: ${theme.colors.background};
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const ProgressTrack = styled.div`
    height: 4px;
    background-color: ${theme.colors.backgroundLighter};
    border-radius: 2px;
    width: 100%;
    overflow: hidden;
`;

const ProgressFill = styled.div<{ percent: number }>`
    height: 100%;
    background-color: ${theme.colors.success};
    width: ${props => props.percent}%;
    transition: width 0.2s linear;
`;

const Overlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${theme.colors.background}cc; // 80% opacity
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border: 2px dashed ${theme.colors.accent};
    margin: 10px;
    border-radius: 8px;
    pointer-events: none; // Let drops pass through to container
`;

const OverlayText = styled.h3`
    color: ${theme.colors.accent};
    margin-top: 10px;
`;

export const SFTPExplorer: React.FC<SFTPExplorerProps> = ({ sessionData, isVisible }) => {
    const [path, setPath] = useState('.');
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Multi-select state
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
    const [isDragging, setIsDragging] = useState(false);

    // Sort State
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Editor State
    const [editor, setEditor] = useState<{ isOpen: boolean, filename: string, content: string } | null>(null);

    // Memoize sorted files
    const sortedFiles = React.useMemo(() => {
        return [...files].sort((a, b) => {
            let res = 0;
            if (a.isDirectory !== b.isDirectory) {
                return a.isDirectory ? -1 : 1; // Directories always first
            }
            if (sortField === 'name') {
                res = a.name.localeCompare(b.name);
            } else if (sortField === 'size') {
                res = a.attributes.size - b.attributes.size;
            }
            return sortDirection === 'asc' ? res : -res;
        });
    }, [files, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Transfer State
    const [transfer, setTransfer] = useState<{ action: string, percent: number, filename: string } | null>(null);

    // Context Menu State
    const [menu, setMenu] = useState<{ x: number, y: number, files: FileEntry[] } | null>(null);

    const handleSelection = (e: React.MouseEvent, file: FileEntry, index: number) => {
        e.stopPropagation();

        const newSelection = new Set(selectedFiles);

        if (e.ctrlKey || e.metaKey) {
            // Toggle
            if (newSelection.has(file.name)) {
                newSelection.delete(file.name);
            } else {
                newSelection.add(file.name);
            }
            setLastSelectedIndex(index);
        } else if (e.shiftKey && lastSelectedIndex !== -1) {
            // Range
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const range = sortedFiles.slice(start, end + 1);

            // If ctrl not held, clear others? Windows explorer behavior usually keeps others if basic click clears. 
            // Standard Shift+Click usually extends from anchor.
            // Let's clear and set range for simple behavior, or add to range if ctrl held?
            // Simple: Shift+Click selects range ensuring anchor is included.
            if (!e.ctrlKey) newSelection.clear();

            range.forEach(f => newSelection.add(f.name));
        } else {
            // Single select
            // If right click, we handle differently in context menu (don't clear if inside selection)
            if (e.button === 2 && newSelection.has(file.name)) {
                // Right click on existing selection: do nothing to selection
                return;
            }
            newSelection.clear();
            newSelection.add(file.name);
            setLastSelectedIndex(index);
        }

        setSelectedFiles(newSelection);
    };

    useEffect(() => {
        if (!sessionData || !isVisible) return;
        if (files.length === 0) loadPath('.');

        const handleResponse = (event: any, msg: any) => {
            // console.log('[SFTP Explorer] Received IPC msg:', msg);
            if (msg.type === 'SFTP_LIST_SUCCESS') {
                // Sorting is now handled by useMemo
                setFiles(msg.payload.list);
                setLoading(false);
            } else if (msg.type === 'SFTP_ERROR') {
                console.error('SFTP Error:', msg.payload.error);
                setError(msg.payload.error);
                setLoading(false);
                setTransfer(null); // Clear transfer on error
            } else if (msg.type === 'SFTP_ACTION_SUCCESS') {
                loadPath(path);
                setTransfer(null); // Clear transfer on success
            } else if (msg.type === 'SFTP_PROGRESS') {
                const { action, transferred, total, filename } = msg.payload;
                const percent = Math.round((transferred / total) * 100);
                setTransfer({ action, percent, filename });
            } else if (msg.type === 'SFTP_READ_FILE_SUCCESS') {
                setEditor({
                    isOpen: true,
                    filename: msg.payload.path.split('/').pop(),
                    content: msg.payload.content
                });
                setLoading(false);
            } else if (msg.type === 'SFTP_WRITE_FILE_SUCCESS') {
                console.log('File saved successfully');
                loadPath(path);
            }
        };

        // @ts-ignore
        const removeListener = window.electron?.ipcRenderer.on('sftp-data', handleResponse);
        return () => {
            // @ts-ignore
            if (removeListener) removeListener();
        };
    }, [sessionData, isVisible, path]);

    // Also Close menu on click outside
    useEffect(() => {
        const closeMenu = () => setMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const loadPath = (targetPath: string) => {
        setLoading(true);
        setError(null);
        setPath(targetPath);
        // @ts-ignore
        window.electron?.ipcRenderer.send('sftp-list', {
            sessionId: sessionData.sessionId,
            path: targetPath,
            reqId: Math.random().toString()
        });
    };

    const handleNavigate = (entry: FileEntry) => {
        if (loading) return;
        if (entry.isDirectory) {
            let newPath = path === '.' ? entry.name : `${path}/${entry.name}`;
            if (path.endsWith('/')) newPath = `${path}${entry.name}`;
            if (targetIsUp(entry.name)) {
                const parts = path.split('/').filter(Boolean);
                parts.pop();
                newPath = parts.length > 0 ? parts.join('/') : '/';
                if (path === '.') return;
            }
            loadPath(newPath);
        }
    };

    const targetIsUp = (name: string) => name === '..';

    const handleUp = () => {
        if (path === '.' || path === '/') return;
        const parts = path.split('/');
        parts.pop();
        const newPath = parts.length > 1 ? parts.join('/') : (path.startsWith('/') ? '/' : '.');
        loadPath(newPath);
    };

    const handleDownload = async () => {
        if (!menu?.files || menu.files.length === 0) return;
        setMenu(null); // Close menu

        // If single file, use save dialog. If multiple, use open dialog (folder select)? 
        // Or just download to Downloads folder?
        // Electron's showSaveDialog is for single file. 
        // For multiple, we usually ask for a DIRECTORY to save into.

        let targetDir: string | undefined;

        if (menu.files.length === 1) {
            const file = menu.files[0];
            const remotePath = path === '.' ? file.name : `${path}/${file.name}`;
            // @ts-ignore
            const result = await window.electron?.ipcRenderer.invoke('show-save-dialog', {
                title: 'Download File',
                defaultPath: file.name
            });
            if (result && !result.canceled && result.filePath) {
                // @ts-ignore
                window.electron?.ipcRenderer.send('sftp-download', {
                    sessionId: sessionData.sessionId,
                    remotePath,
                    localPath: result.filePath
                });
            }
        } else {
            // Multiple files - Ask for folder
            // @ts-ignore
            const result = await window.electron?.ipcRenderer.invoke('show-open-dialog', {
                title: 'Select Destination Folder',
                properties: ['openDirectory', 'createDirectory']
            });

            if (result && !result.canceled && result.filePaths.length > 0) {
                targetDir = result.filePaths[0];
                // Loop and download
                // NOTE: This might flood the worker. In real app, we should queue.
                // For now, fire away.
                menu.files.forEach(file => {
                    const remotePath = path === '.' ? file.name : `${path}/${file.name}`;
                    const localPath = `${targetDir}\\${file.name}`; // Windows path separator for now, should use path.join in main
                    // Actually passing generic path to main is better.
                    // Let's assume user picked a folder.
                    // We need to construct local path. 
                    // Since we are in renderer, we don't have 'path' module easily unless exposed.
                    // We'll rely on simple string concat for now or send "download-multiple" IPC?
                    // Let's keep simple:
                    // @ts-ignore
                    window.electron?.ipcRenderer.send('sftp-download', {
                        sessionId: sessionData.sessionId,
                        remotePath,
                        localPath: targetDir + (targetDir?.endsWith('\\') ? '' : '\\') + file.name
                    });
                });
            }
        }
    };

    const handleEdit = (file: FileEntry) => {
        if (!file) return;
        setMenu(null);
        setLoading(true);
        const remotePath = path === '.' ? file.name : `${path}/${file.name}`;
        // @ts-ignore
        window.electron?.ipcRenderer.send('sftp-read-file', {
            sessionId: sessionData.sessionId,
            path: remotePath
        });
    };

    const handleSaveFile = async (content: string) => {
        if (!editor || !editor.isOpen) return;
        const remotePath = path === '.' ? editor.filename : `${path}/${editor.filename}`;

        // @ts-ignore
        window.electron?.ipcRenderer.send('sftp-write-file', {
            sessionId: sessionData.sessionId,
            path: remotePath,
            content
        });

        setEditor(null);
    };

    const handleContextMenu = (e: React.MouseEvent, file: FileEntry | null) => {
        e.preventDefault();
        e.stopPropagation();

        let targetFiles: FileEntry[] = [];

        if (file) {
            // If right-clicked file is part of selection, use selection.
            // If not, select it and use it.
            if (selectedFiles.has(file.name)) {
                targetFiles = sortedFiles.filter(f => selectedFiles.has(f.name));
            } else {
                // Update selection to just this file
                const newSet = new Set<string>();
                newSet.add(file.name);
                setSelectedFiles(newSet);
                setLastSelectedIndex(sortedFiles.indexOf(file));
                targetFiles = [file];
            }
        }

        setMenu({ x: e.clientX, y: e.clientY, files: targetFiles });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!menu?.files || menu.files.length === 0) return;

        const count = menu.files.length;
        const msg = count === 1 ? `delete ${menu.files[0].name}?` : `delete ${count} items?`;

        if (!confirm(`Are you sure you want to ${msg}`)) return;

        menu.files.forEach(file => {
            const targetPath = path === '.' ? file.name : `${path}/${file.name}`;
            // @ts-ignore
            window.electron?.ipcRenderer.send('sftp-delete', {
                sessionId: sessionData.sessionId,
                path: targetPath,
                isDirectory: file.isDirectory
            });
        });

        // Clear selection after delete? Or let visual update handle it?
        // Better to wait for update.
    };

    const handleNewFolder = () => {
        const name = prompt('New Folder Name:');
        if (!name) return;
        const targetPath = path === '.' ? name : `${path}/${name}`;
        // @ts-ignore
        window.electron?.ipcRenderer.send('sftp-mkdir', {
            sessionId: sessionData.sessionId,
            path: targetPath
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only disable if we're leaving the container itself, not entering a child
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            Array.from(e.dataTransfer.files).forEach((file: any) => {
                if (file.path) {
                    const remotePath = path === '.' ? file.name : `${path}/${file.name}`;
                    // @ts-ignore
                    window.electron?.ipcRenderer.send('sftp-upload', {
                        sessionId: sessionData.sessionId,
                        localPath: file.path,
                        remotePath
                    });
                }
            });
        }
    };

    // RENDER:
    return (
        <ExplorerContainer
            onContextMenu={(e) => handleContextMenu(e, null)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => setSelectedFiles(new Set())} // Click background clears selection
            style={{ position: 'relative' }} // For absolute overlay
        >
            {isDragging && (
                <Overlay>
                    <ArrowUp size={48} color={theme.colors.accent} />
                    <OverlayText>Drop to Upload</OverlayText>
                </Overlay>
            )}

            <FileEditorModal
                isOpen={!!editor && editor.isOpen}
                filename={editor?.filename || ''}
                initialContent={editor?.content || ''}
                onClose={() => setEditor(null)}
                onSave={handleSaveFile}
            />

            <Toolbar>
                <IconButton onClick={() => loadPath('.')} title="Home"><Home size={16} /></IconButton>
                <IconButton onClick={handleUp} title="Up"><ArrowUp size={16} /></IconButton>
                <IconButton onClick={() => loadPath(path)} title="Refresh"><RefreshCw size={16} /></IconButton>
                <IconButton onClick={handleNewFolder} title="New Folder"><Folder size={16} color={theme.colors.accent} /></IconButton>
                <BreadcrumbsContainer>
                    <BreadcrumbItem onClick={() => loadPath('.')}>
                        <Home size={12} style={{ marginRight: 4 }} /> Home
                    </BreadcrumbItem>
                    {path !== '.' && path !== '/' && path.split('/').filter(Boolean).map((part, index, array) => {
                        const isLast = index === array.length - 1;
                        const target = array.slice(0, index + 1).join('/');
                        return (
                            <React.Fragment key={index}>
                                <Separator>/</Separator>
                                <BreadcrumbItem
                                    active={isLast}
                                    onClick={() => !isLast && loadPath(target)}
                                >
                                    {part}
                                </BreadcrumbItem>
                            </React.Fragment>
                        );
                    })}
                </BreadcrumbsContainer>
            </Toolbar>

            <TableContainer>
                {loading && <Spinner />}
                {error && <div style={{ padding: 10, color: theme.colors.danger, textAlign: 'center' }}>{error}</div>}

                {!loading && !error && (
                    <FileList>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                    Name {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </th>
                                <th onClick={() => handleSort('size')} style={{ width: 80, cursor: 'pointer' }}>
                                    Size {sortField === 'size' && (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </th>
                                <th style={{ width: 80 }}>Perms</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Parent Directory Link */}
                            {path !== '.' && path !== '/' && (
                                <FileRow onClick={handleUp} onDoubleClick={handleUp}>
                                    <td>
                                        <NameCell>
                                            <Folder size={14} color={theme.colors.secondary} />
                                            ..
                                        </NameCell>
                                    </td>
                                    <td></td>
                                    <td></td>
                                </FileRow>
                            )}

                            {sortedFiles.map((file, i) => (
                                <FileRow
                                    key={i}
                                    selected={selectedFiles.has(file.name)}
                                    onClick={(e) => handleSelection(e, file, i)}
                                    // Use double click to download if it's a file?
                                    // Current logic: handleNavigate only checks directory.
                                    // Let's modify handleNavigate to download file if not directory?
                                    // Or leave consistent with Explorer (open). For now leave context menu.
                                    onDoubleClick={() => handleNavigate(file)}
                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                >
                                    <td>
                                        <NameCell>
                                            {getFileIcon(file.name, file.isDirectory)}
                                            {file.name}
                                        </NameCell>
                                    </td>
                                    <td>{file.isDirectory ? '-' : formatBytes(file.attributes.size)}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 10, color: getPermColor(file.longname ? file.longname.split(' ')[0] : '') }}>
                                        {file.longname ? file.longname.split(' ')[0] : ''}
                                    </td>
                                </FileRow>
                            ))}
                        </tbody>
                    </FileList>
                )}
            </TableContainer>

            {transfer && (
                <Footer>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{transfer.action === 'download' ? 'Downloading' : 'Uploading'} {transfer.filename}...</span>
                        <span>{transfer.percent}%</span>
                    </div>
                    <ProgressTrack>
                        <ProgressFill percent={transfer.percent} />
                    </ProgressTrack>
                </Footer>
            )}

            {menu && (
                <ContextMenu x={menu.x} y={menu.y} onClick={(e) => e.stopPropagation()}>
                    {menu.files.length > 0 ? (
                        <>
                            <MenuItem onClick={() => {
                                // If 1 file and it's text/code, allow edit
                                if (menu.files.length === 1 && !menu.files[0].isDirectory) {
                                    handleEdit(menu.files[0]);
                                }
                            }}>Edit</MenuItem>
                            <MenuItem onClick={handleDownload}>Download {menu.files.length > 1 ? `(${menu.files.length})` : ''}</MenuItem>
                            <MenuItem onClick={handleDelete} style={{ color: theme.colors.danger }}>Delete {menu.files.length > 1 ? `(${menu.files.length})` : ''}</MenuItem>
                        </>
                    ) : (
                        <>
                            <MenuItem onClick={handleNewFolder}>New Folder</MenuItem>
                            <MenuItem onClick={() => loadPath(path)}>Refresh</MenuItem>
                        </>
                    )}
                </ContextMenu>
            )}
        </ExplorerContainer>
    );
};

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
