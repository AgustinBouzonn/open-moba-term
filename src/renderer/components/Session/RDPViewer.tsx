import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    overflow: auto;
    position: relative;
    outline: none;
`;

const Canvas = styled.canvas`
    background-color: #111;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
    cursor: default;
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

interface RDPViewerProps {
    sessionData: any;
    isActive: boolean;
}

// Basic Scancode Map (incomplete, but covers basics)
const getScancode = (code: string): number => {
    // Map KeyboardEvent.code to Scancode
    const map: Record<string, number> = {
        'Escape': 1, 'Digit1': 2, 'Digit2': 3, 'Digit3': 4, 'Digit4': 5, 'Digit5': 6, 'Digit6': 7, 'Digit7': 8, 'Digit8': 9, 'Digit9': 10, 'Digit0': 11,
        'Minus': 12, 'Equal': 13, 'Backspace': 14, 'Tab': 15,
        'KeyQ': 16, 'KeyW': 17, 'KeyE': 18, 'KeyR': 19, 'KeyT': 20, 'KeyY': 21, 'KeyU': 22, 'KeyI': 23, 'KeyO': 24, 'KeyP': 25,
        'BracketLeft': 26, 'BracketRight': 27, 'Enter': 28, 'ControlLeft': 29,
        'KeyA': 30, 'KeyS': 31, 'KeyD': 32, 'KeyF': 33, 'KeyG': 34, 'KeyH': 35, 'KeyJ': 36, 'KeyK': 37, 'KeyL': 38, 'Semicolon': 39, 'Quote': 40,
        'Backquote': 41, 'ShiftLeft': 42, 'Backslash': 43,
        'KeyZ': 44, 'KeyX': 45, 'KeyC': 46, 'KeyV': 47, 'KeyB': 48, 'KeyN': 49, 'KeyM': 50, 'Comma': 51, 'Period': 52, 'Slash': 53, 'ShiftRight': 54,
        'NumpadMultiply': 55, 'AltLeft': 56, 'Space': 57, 'CapsLock': 58,
        'F1': 59, 'F2': 60, 'F3': 61, 'F4': 62, 'F5': 63, 'F6': 64, 'F7': 65, 'F8': 66, 'F9': 67, 'F10': 68,
        'NumLock': 69, 'ScrollLock': 70, 'Numpad7': 71, 'Numpad8': 72, 'Numpad9': 73, 'NumpadSubtract': 74,
        'Numpad4': 75, 'Numpad5': 76, 'Numpad6': 77, 'NumpadAdd': 78, 'Numpad1': 79, 'Numpad2': 80, 'Numpad3': 81, 'Numpad0': 82, 'NumpadDecimal': 83,
        'F11': 87, 'F12': 88,
        'ArrowUp': 0xE048, 'ArrowLeft': 0xE04B, 'ArrowRight': 0xE04D, 'ArrowDown': 0xE050
        // ... extend as needed
    };
    return map[code] || 0;
};

export const RDPViewer: React.FC<RDPViewerProps> = ({ sessionData, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial size request
    const width = 1280;
    const height = 720;

    useEffect(() => {
        if (!isActive) return;

        // @ts-ignore
        window.electron?.ipcRenderer.send('connect-rdp', {
            sessionId: sessionData.sessionId,
            host: sessionData.host,
            port: sessionData.port || 3389,
            username: sessionData.username,
            password: sessionData.password,
            domain: sessionData.domain,
            width,
            height
        });

        // Set canvas size initially
        if (canvasRef.current) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
        }

        const handleMessage = (event: any, msg: any) => {
            if (msg.type === 'RDP_CONNECTED') {
                setConnected(true);
            } else if (msg.type === 'RDP_ERROR') {
                setError(msg.payload.error);
                setConnected(false);
            } else if (msg.type === 'RDP_DISCONNECTED') {
                setConnected(false);
                setError('RDP Disconnected');
            } else if (msg.type === 'RDP_BITMAP') {
                renderBitmap(msg.payload);
            }
        };

        // @ts-ignore
        const removeListener = window.electron?.ipcRenderer.on('sftp-data', handleMessage);

        return () => {
            // @ts-ignore
            if (removeListener) removeListener();
            // Optional: disconnect
        };
    }, [isActive, sessionData]);

    const renderBitmap = (payload: any) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const { x, y, width, height, data } = payload;
        if (data && width > 0 && height > 0) {
            try {
                // Ensure data is Uint8ClampedArray for ImageData
                // If it's a regular array or Buffer, convert it.
                // Note: RDP might send BGRA or RGB? node-rdpjs decompression creates RGBA (I assume).
                // Let's assume RGBA for now.
                const array = new Uint8ClampedArray(data);
                const imageData = new ImageData(array, width, height);
                ctx.putImageData(imageData, x, y);
            } catch (e) {
                console.error('Failed to render RDP bitmap', e);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!connected) return;
        e.preventDefault();
        const scancode = getScancode(e.code);
        if (scancode) {
            // @ts-ignore
            window.electron?.ipcRenderer.send('rdp-key-event', {
                sessionId: sessionData.sessionId,
                code: scancode,
                isPressed: true
            });
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (!connected) return;
        e.preventDefault();
        const scancode = getScancode(e.code);
        if (scancode) {
            // @ts-ignore
            window.electron?.ipcRenderer.send('rdp-key-event', {
                sessionId: sessionData.sessionId,
                code: scancode,
                isPressed: false
            });
        }
    };

    const handleMouseEvent = (e: React.MouseEvent, eventType: 'move' | 'down' | 'up') => {
        if (!connected) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);

        let button = 0; // Move
        let isPressed = false;

        if (eventType === 'down' || eventType === 'up') {
            // Map button: 0=Left(1), 1=Middle(3), 2=Right(2) typically in DOM
            // RDP: 1=Left, 2=Right, 3=Middle
            if (e.button === 0) button = 1;
            else if (e.button === 2) button = 2;
            else if (e.button === 1) button = 3;

            isPressed = (eventType === 'down');
        }

        // @ts-ignore
        window.electron?.ipcRenderer.send('rdp-mouse-event', {
            sessionId: sessionData.sessionId,
            x,
            y,
            button,
            isPressed
        });
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!connected) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);

        // Step: typically 120 per click? RDP expects...?
        // node-rdpjs sendWheelEvent(x, y, step, isNegative, isHorizontal)
        // step seems to be magnitude? 
        const step = Math.abs(e.deltaY);
        const isNegative = e.deltaY > 0; // Down is positive deltaY, but negative wheel?
        // Wait, standard mouse wheel: Up = negative deltaY. Down = positive deltaY.
        // RDP "Negative" flag usually means rotation backward (towards user).

        // @ts-ignore
        window.electron?.ipcRenderer.send('rdp-wheel-event', {
            sessionId: sessionData.sessionId,
            x,
            y,
            step,
            isNegative,
            isHorizontal: false
        });
    };

    return (
        <Container
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
        >
            {error && <StatusOverlay>Error: {error}</StatusOverlay>}
            {!connected && !error && <StatusOverlay>Connecting to RDP...</StatusOverlay>}

            <Canvas
                ref={canvasRef}
                onMouseMove={e => handleMouseEvent(e, 'move')}
                onMouseDown={e => { handleMouseEvent(e, 'down'); containerRef.current?.focus(); }}
                onMouseUp={e => handleMouseEvent(e, 'up')}
                onWheel={handleWheel}
                onContextMenu={e => e.preventDefault()}
            />
        </Container>
    );
};
