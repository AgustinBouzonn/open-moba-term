import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import { theme } from './styles/theme';
import { Sidebar } from './components/Layout/Sidebar';
import { TerminalView } from './components/Terminal/TerminalView';
import { QuickConnect } from './components/Session/QuickConnect';
import { SFTPExplorer } from './components/SFTP/SFTPExplorer';
import { VNCViewer } from './components/Session/VNCViewer';
import { RDPViewer } from './components/Session/RDPViewer';
import { SavedSessions } from './components/Session/SavedSessions';
import { useEffect, useRef } from 'react';

const GlobalStyles = css`
  body {
    margin: 0;
    padding: 0;
    background-color: ${theme.colors.background};
    color: ${theme.colors.foreground};
    font-family: ${theme.typography.fontFamily};
    overflow: hidden; /* App feels like native */
  }
  
  * {
    box-sizing: border-box;
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-width: 0;
`;

const TitleBar = styled.div`
  height: 32px;
  background-color: ${theme.colors.background};
  display: flex;
  align-items: center;
  padding-left: ${theme.spacing.md};
  font-size: 12px;
  color: ${theme.colors.foreground};
  border-bottom: 1px solid ${theme.colors.border};
  -webkit-app-region: drag; /* Draggable window */
  user-select: none;
`;

const Controls = styled.div`
  margin-left: auto;
  margin-right: ${theme.spacing.sm};
  -webkit-app-region: no-drag;
  display: flex;
  gap: 8px;
`;

const ControlButton = styled.button`
    background: none;
    border: none;
    color: ${theme.colors.foreground};
    cursor: pointer;
    &:hover { color: ${theme.colors.accent}; }
`;

import { FolderOpen, Terminal as TerminalIcon, LogOut, Plus, X } from 'lucide-react';

// New Styled Components for Layout
const SplitContainer = styled.div`
    display: flex;
    flex: 1;
    height: 100%;
    overflow: hidden;
    min-width: 0;
`;

const TerminalWrapper = styled.div`
    flex: 1;
    height: 100%;
    min-width: 0;
    position: relative;
    display: flex;
`;

const SFTPWrapper = styled.div<{ visible: boolean }>`
    width: ${props => props.visible ? '300px' : '0px'};
    transition: width 0.3s ease;
    border-left: ${props => props.visible ? `1px solid ${theme.colors.border}` : 'none'};
    overflow: hidden;
    background-color: ${theme.colors.backgroundLighter};
    display: flex;
    flex-direction: column;
`;

// Tab Bar Styles
const TabsContainer = styled.div`
  display: flex;
  background-color: ${theme.colors.backgroundDark};
  border-bottom: 1px solid ${theme.colors.border};
  height: 40px;
  align-items: flex-end;
  padding-left: 10px;
  gap: 2px;
  -webkit-app-region: no-drag;
`;

const TabItem = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 32px;
  background-color: ${props => props.active ? theme.colors.background : theme.colors.backgroundLighter}40;
  color: ${props => props.active ? theme.colors.accent : theme.colors.foreground};
  border-radius: 8px 8px 0 0;
  border: 1px solid ${theme.colors.border};
  border-bottom: none;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  max-width: 200px;
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.active && `
    background-color: ${theme.colors.background};
    border-top: 2px solid ${theme.colors.primary};
    margin-bottom: -1px;
    z-index: 1;
    font-weight: 500;
  `}

  &:hover {
    background-color: ${props => props.active ? theme.colors.background : theme.colors.backgroundLighter};
  }
`;

const TabClose = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 50%;
  opacity: 0.6;
  &:hover {
    background-color: ${theme.colors.danger}40;
    color: ${theme.colors.danger};
    opacity: 1;
  }
`;

function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'sessions'>('terminal');

  useEffect(() => {
    console.log('[App] v2.1 Initialized');
  }, []);

  // Multi-session state
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [showSFTP, setShowSFTP] = useState(false);

  const getActiveSession = () => sessions.find(s => s.sessionId === activeSessionId);

  const handleConnect = (config: any) => {
    // Generate ID
    const sessionId = Math.random().toString(36).substring(7);
    const payload = { ...config, sessionId };

    console.log('[App] New Session [MULTI-SESSION]:', payload);

    if (payload.protocol === 'vnc') {
      // @ts-ignore
      window.electron?.ipcRenderer.send('connect-vnc', payload);
    } else if (payload.protocol === 'rdp') {
      // @ts-ignore
      window.electron?.ipcRenderer.send('connect-rdp', payload);
    } else {
      // Default to SSH
      // @ts-ignore
      window.electron?.ipcRenderer.send('connect-ssh', payload);
    }

    setSessions(prev => [...prev, payload]);
    setActiveSessionId(sessionId);
    setActiveTab('terminal');
    setShowSFTP(false); // Wait for SSH_READY for THIS session
  };

  useEffect(() => {
    // Listen for SSH_READY etc.
    const handleReady = (event: any, msg: any) => {
      // ... existing logic ...
      if (msg.type === 'SSH_READY') {
        console.log('[App] Session Ready:', msg.payload.sessionId);
        if (sessions.length === 0 || msg.payload.sessionId === activeSessionId) {
          setShowSFTP(true);
        }
      }
    };

    // Listen for the dedicated MessagePort via window.postMessage (from Preload)
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ssh-channel-init') {
        const port = event.ports[0];
        const sessionId = event.data.payload?.sessionId;

        if (port && sessionId) {
          console.log('[App] Received Dedicated Port for Session:', sessionId);
          port.start();
          setSessions(prev => prev.map(s => {
            if (s.sessionId === sessionId) {
              return { ...s, sshChannel: port };
            }
            return s;
          }));
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);

    // @ts-ignore
    const removeDataListener = window.electron?.ipcRenderer.on('ssh-data', handleReady);


    return () => {
      window.removeEventListener('message', handleWindowMessage);
      // @ts-ignore
      if (removeDataListener) removeDataListener();
    }
  }, [activeSessionId, sessions.length]); // Fix dependencies

  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    // @ts-ignore
    window.electron?.ipcRenderer.send('window-control', action);
  };

  const handleDisconnect = (sessionIdToClose: string) => {
    // Send disconnect to backend
    // @ts-ignore
    window.electron?.ipcRenderer.send('disconnect-ssh', { sessionId: sessionIdToClose });

    setSessions(prev => {
      const newSessions = prev.filter(s => s.sessionId !== sessionIdToClose);
      if (newSessions.length === 0) {
        setActiveSessionId(null);
        setShowSFTP(false);
      } else if (activeSessionId === sessionIdToClose) {
        // Switch to last available
        setActiveSessionId(newSessions[newSessions.length - 1].sessionId);
      }
      return newSessions;
    });
  };

  const sessionData = getActiveSession();

  return (
    <>
      <Global styles={GlobalStyles} />
      <AppContainer>
        <Sidebar activeTab={activeTab as any} onTabChange={(t) => setActiveTab(t as any)} />
        <ContentArea>
          <TitleBar>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>OpenMoba {sessionData ? `- ${sessionData.host}` : ''}</span>
              {sessionData && (
                <div style={{ display: 'flex', gap: 5, WebkitAppRegion: 'no-drag' } as any}>
                  <ControlButton onClick={() => setShowSFTP(!showSFTP)} title="Toggle SFTP">
                    <FolderOpen size={14} color={showSFTP ? theme.colors.accent : theme.colors.foreground} />
                  </ControlButton>
                  <ControlButton onClick={() => handleDisconnect(activeSessionId!)} title="Disconnect" style={{ color: theme.colors.danger }}>
                    <LogOut size={14} />
                  </ControlButton>
                </div>
              )}
            </div>

            <Controls>
              <ControlButton onClick={() => handleWindowControl('minimize')}>_</ControlButton>
              <ControlButton onClick={() => handleWindowControl('maximize')}>□</ControlButton>
              <ControlButton onClick={() => handleWindowControl('close')} style={{ color: theme.colors.danger }}>×</ControlButton>
            </Controls>
          </TitleBar>

          {/* Tabs Bar */}
          {activeTab === 'terminal' && sessions.length > 0 && (
            <TabsContainer>
              {sessions.map(s => (
                <TabItem
                  key={s.sessionId}
                  active={s.sessionId === activeSessionId}
                  onClick={() => { setActiveSessionId(s.sessionId); setShowSFTP(true); /* Re-enable SFTP view if switching? state persistence needed */ }}
                >
                  <TerminalIcon size={12} />
                  {s.host}
                  <TabClose onClick={(e) => { e.stopPropagation(); handleDisconnect(s.sessionId); }}>
                    <X size={12} />
                  </TabClose>
                </TabItem>
              ))}
              <ControlButton onClick={() => setActiveSessionId(null)} title="New Tab">
                <Plus size={16} />
              </ControlButton>
            </TabsContainer>
          )}

          {activeTab === 'terminal' && (
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {/* Render ALL sessions but hide inactive ones to preserve state */}
              {sessions.map(session => (
                <div
                  key={session.sessionId}
                  style={{
                    display: session.sessionId === activeSessionId ? 'block' : 'none',
                    height: '100%',
                    width: '100%'
                  }}
                >
                  <SplitContainer>
                    {session.protocol === 'vnc' ? (
                      <div style={{ flex: 1, backgroundColor: '#000' }}>
                        <VNCViewer sessionData={session} isActive={session.sessionId === activeSessionId} />
                      </div>
                    ) : session.protocol === 'rdp' ? (
                      <div style={{ flex: 1, backgroundColor: '#000' }}>
                        <RDPViewer sessionData={session} isActive={session.sessionId === activeSessionId} />
                      </div>
                    ) : (
                      <>
                        <TerminalWrapper>
                          <TerminalView sessionData={session} />
                        </TerminalWrapper>
                        <SFTPWrapper visible={showSFTP}>
                          <SFTPExplorer sessionData={session} isVisible={showSFTP && session.sessionId === activeSessionId} />
                        </SFTPWrapper>
                      </>
                    )}
                  </SplitContainer>
                </div>
              ))}

              {/* Empty State / New Connection */}
              {(sessions.length === 0 || activeSessionId === null) && (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QuickConnect onConnect={handleConnect} />
                </div>
              )}
            </div>
          )}

          {/* Control Bar for Active Session */}
          {activeSessionId && getActiveSession() && (
            <div style={{ position: 'absolute', top: 5, right: 100, zIndex: 1000, display: 'flex', gap: 10 }}>
              <ControlButton onClick={() => setShowSFTP(!showSFTP)} title="Toggle SFTP">
                <FolderOpen size={16} color={showSFTP ? theme.colors.accent : theme.colors.foreground} />
              </ControlButton>
              <ControlButton onClick={() => handleDisconnect(activeSessionId)} title="Disconnect" style={{ color: theme.colors.danger }}>
                <LogOut size={16} />
              </ControlButton>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div style={{ height: '100%', overflow: 'auto' }}>
              <SavedSessions onConnect={(s) => {
                handleConnect(s);
              }} />
            </div>
          )}
        </ContentArea>
      </AppContainer>
    </>
  );
}

export default App;
