import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebglAddon } from 'xterm-addon-webgl';
import 'xterm/css/xterm.css';
import { theme } from '../../styles/theme';
import { SystemStatusBar } from './SystemStatusBar';

const ViewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const TerminalDiv = styled.div`
  flex: 1;
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.sm} 0 0 ${theme.spacing.sm}; 
  overflow: hidden;
  position: relative;
  
  .xterm-viewport::-webkit-scrollbar { width: 8px; }
  .xterm-viewport::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 4px; }
`;

export const TerminalView: React.FC<{ sessionData: any }> = ({ sessionData }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm.js
        const term = new Terminal({
            cursorBlink: true,
            fontFamily: theme.typography.fontFamily,
            fontSize: 14,
            rows: 30,
            cols: 80,
            theme: {
                background: theme.colors.background,
                foreground: theme.colors.foreground,
                cursor: theme.colors.accent,
                selectionBackground: theme.colors.backgroundLighter,
                black: theme.colors.black,
            },
            allowProposedApi: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        // ...

        // Enable WebGL for performance

        // Enable WebGL for performance
        try {
            const webglAddon = new WebglAddon();
            webglAddon.onContextLoss(e => {
                webglAddon.dispose();
            });
            term.loadAddon(webglAddon);
            console.log('[Terminal] WebGL accelerated rendering enabled');
        } catch (e) {
            console.warn('[Terminal] WebGL not supported, falling back to DOM renderer', e);
        }

        term.open(terminalRef.current);
        term.write('Welcome to \x1b[1;36mOpenMoba\x1b[0m\r\n');
        term.write(`Connecting to ${sessionData.host}...\r\n`);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Fit logic
        const fit = () => {
            if (!terminalRef.current || !xtermRef.current) return;
            // @ts-ignore
            if (xtermRef.current._core._isDisposed) return; // Private API check, or just try-catch

            if (terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
                try {
                    fitAddon.fit();
                    const { rows, cols } = term;
                    if (rows < 2 || cols < 10) return;
                    // @ts-ignore
                    window.electron?.ipcRenderer.send('ssh-resize', {
                        sessionId: sessionData.sessionId,
                        rows,
                        cols
                    });
                } catch (e) {
                    // Ignore errors if terminal is disposing
                    // console.error('Fit error', e); 
                }
            }
        };

        const timer = setTimeout(fit, 100);

        let animationFrameId: number;
        const resizeObserver = new ResizeObserver(() => {
            animationFrameId = requestAnimationFrame(fit);
        });
        resizeObserver.observe(terminalRef.current);

        // IPC & Port Listeners
        const handleServerMessage = (msg: any) => {
            if (msg.payload?.sessionId !== sessionData.sessionId) return;

            if (msg.type === 'SSH_READY') { /* Clean start */ }
            else if (msg.type === 'SSH_ERROR') {
                term.write(`\r\n\x1b[1;31mConnection Error: ${msg.payload.error}\x1b[0m\r\n`);
            }
            else if (msg.type === 'SSH_CLOSE') {
                term.write(`\r\n\x1b[1;33mConnection Closed\x1b[0m\r\n`);
            }
            else if (msg.type === 'SSH_DATA' && msg.payload.data) {
                term.write(msg.payload.data);
            }
            else if (msg.type === 'SSH_STATS') {
                setStats(msg.payload.stats);
            }
        };

        let removeListener: any;

        if (sessionData.sshChannel) {
            console.log('[Terminal] Using Direct MessagePort for Session:', sessionData.sessionId);
            // @ts-ignore
            sessionData.sshChannel.onmessage = (event) => {
                handleServerMessage(event.data);
            };
        } else {
            console.log('[Terminal] Using Legacy IPC for Session:', sessionData.sessionId);
            // @ts-ignore
            removeListener = window.electron?.ipcRenderer.on('ssh-data', (_: any, msg: any) => handleServerMessage(msg));
        }

        term.onData(data => {
            const payload = { type: 'SSH_INPUT', payload: { sessionId: sessionData.sessionId, data } };
            if (sessionData.sshChannel) {
                sessionData.sshChannel.postMessage(payload);
            } else {
                // @ts-ignore
                window.electron?.ipcRenderer.send('ssh-input', payload.payload);
            }
        });

        // Resize
        term.onResize(({ rows, cols }) => {
            const payload = { type: 'SSH_RESIZE', payload: { sessionId: sessionData.sessionId, rows, cols } };
            if (sessionData.sshChannel) {
                sessionData.sshChannel.postMessage(payload);
            } else {
                // @ts-ignore
                window.electron?.ipcRenderer.send('ssh-resize', payload.payload);
            }
        });

        return () => {
            // 1. Stop all incoming events
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timer);

            // @ts-ignore
            if (removeListener) removeListener();
            if (sessionData.sshChannel) {
                sessionData.sshChannel.onmessage = null;
            }

            // 2. Dispose terminal last
            try {
                // Determine if already disposed to allow idempotent cleanup
                // @ts-ignore
                if (!term._core._isDisposed) {
                    term.dispose();
                }
            } catch (e) {
                console.warn('Error disposing terminal:', e);
            }
        };
    }, [sessionData, sessionData.sshChannel]); // Re-run if port arrives

    return (
        <ViewWrapper>
            <TerminalDiv ref={terminalRef} />
            <SystemStatusBar stats={stats} />
        </ViewWrapper>
    );
};
