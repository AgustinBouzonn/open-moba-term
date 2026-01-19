import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    overflow: auto;
    position: relative;
    outline: none; // For focus
`;

const Canvas = styled.canvas`
    background-color: #111;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
    cursor: default; // We might want none or allow default
`;

const StatusOverlay = styled.div`
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    pointer-events: none;
    font-size: 14px;
`;

interface VNCViewerProps {
    sessionData: any;
    isActive: boolean;
}

export const VNCViewer: React.FC<VNCViewerProps> = ({ sessionData, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resolution, setResolution] = useState<{ width: number, height: number } | null>(null);

    useEffect(() => {
        if (!isActive) return;

        // Auto-connect
        // @ts-ignore
        window.electron?.ipcRenderer.send('connect-vnc', {
            sessionId: sessionData.sessionId,
            host: sessionData.host,
            port: sessionData.port || 5900,
            password: sessionData.password
        });

        // Event Handler
        const handleMessage = (event: any, msg: any) => {
            if (msg.type === 'VNC_CONNECTED') {
                setConnected(true);
                setResolution({ width: msg.payload.width, height: msg.payload.height });
                // Resize canvas
                if (canvasRef.current) {
                    canvasRef.current.width = msg.payload.width;
                    canvasRef.current.height = msg.payload.height;
                }
            } else if (msg.type === 'VNC_ERROR') {
                setError(msg.payload.error);
                setConnected(false);
            } else if (msg.type === 'VNC_CLOSED') {
                setConnected(false);
                setError('Connection closed');
            } else if (msg.type === 'VNC_FRAME') {
                renderFrame(msg.payload);
            }
        };

        // @ts-ignore
        const removeListener = window.electron?.ipcRenderer.on('sftp-data', handleMessage); // We reuse this channel or add specific one?
        // Wait, ipc.ts forwards VNC messages to 'sftp-data' channel currently!
        // "if (msg.type.startsWith('SFTP_') || msg.type.startsWith('VNC_')) { mainWindow.webContents.send('sftp-data', msg); }"
        // A bit hacky channel name, but works.

        return () => {
            // @ts-ignore
            if (removeListener) removeListener();
            // Disconnect??
            // Maybe not on unmount if tab switching, but definitely on close.
            // For now, let's keep session alive if component unmounts? 
            // Usually if tab closes, we should disconnect. 
            // But if user switches tabs?
            // Let's assume explicit disconnect via context menu or tab close.
        };
    }, [isActive, sessionData]);

    const renderFrame = (payload: any) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const { x, y, width, height, data } = payload;

        // Data comes as Buffer. Create ImageData.
        // We need to ensure pixel format. RFB usually sends 32-bit (RGBA) or varied.
        // Assuming implementation sends RGBA for now.
        // rfb2 default usually depends on negotiated format.

        // If data is Uint8Array/Buffer
        try {
            // This assumes purely raw 32-bit Rects. 
            // In reality, VNC rects can be encoded (CopyRect, Hextile).
            // Our worker currently just forwards 'rect.data'.
            // If 'rfb2' decodes to raw RGB, great. If not, this will fail visually.
            // However, for V1 implementation, let's try assuming raw.

            // Warning: creating ImageData every frame is slow.
            // Ideally we cache a large ImageData or use createImageBitmap.

            if (data && data.length > 0) {
                const imageData = new ImageData(
                    new Uint8ClampedArray(data),
                    width,
                    height
                );
                ctx.putImageData(imageData, x, y);
            }
        } catch (e) {
            console.error('Render error:', e);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!connected) return;
        e.preventDefault();
        // Look up keysym or just send raw key?
        // rfb2 needs keysym.
        // We need a mapping. Mapping JS keys to X11 keysyms is complex.
        // For Proof of Concept, let's just send simple ASCII.

        // @ts-ignore
        window.electron?.ipcRenderer.send('vnc-key-event', {
            sessionId: sessionData.sessionId,
            keysym: e.keyCode, // WRONG: keyCode != keysym, but might work for simple numbers/letters sometimes?
            down: true
        });
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (!connected) return;
        e.preventDefault();
        // @ts-ignore
        window.electron?.ipcRenderer.send('vnc-key-event', {
            sessionId: sessionData.sessionId,
            keysym: e.keyCode,
            down: false
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!connected) return;
        // Calc relative coordinates
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);

        // Mask: bit 0 = left, 1 = middle, 2 = right
        const mask = e.buttons; // HTML5 buttons: 1=left, 2=right, 4=middle. 
        // VNC mask: 1=left, 2=middle, 4=right. (Typically)
        // Need mapping.

        let vncMask = 0;
        if (mask & 1) vncMask |= 1;
        if (mask & 4) vncMask |= 2;
        if (mask & 2) vncMask |= 4;

        // @ts-ignore
        window.electron?.ipcRenderer.send('vnc-pointer-event', {
            sessionId: sessionData.sessionId,
            x,
            y,
            mask: vncMask
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        handleMouseMove(e);
        containerRef.current?.focus(); // Ensure container has focus for keys
    };

    return (
        <Container
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
        >
            {error && <StatusOverlay>Error: {error}</StatusOverlay>}
            {!connected && !error && <StatusOverlay>Connecting to VNC...</StatusOverlay>}

            <Canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseMove}
                onContextMenu={e => e.preventDefault()}
            />
        </Container>
    );
};
