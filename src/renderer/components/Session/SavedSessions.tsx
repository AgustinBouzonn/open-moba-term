import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

const Container = styled.div`
  padding: ${theme.spacing.md};
  color: ${theme.colors.foreground};
`;

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const SessionItem = styled.div`
  background: ${theme.colors.backgroundDark};
  padding: ${theme.spacing.sm};
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: ${theme.colors.backgroundLighter};
  }
`;

const DeleteBtn = styled.button`
    background: transparent;
    border: none;
    color: ${theme.colors.error};
    cursor: pointer;
    font-size: 1.2rem;
    &:hover { opacity: 0.8; }
`;

interface Session {
    id: string;
    label: string;
    host: string;
    port: number;
    username: string;
}

export const SavedSessions: React.FC<{ onConnect: (s: any) => void }> = ({ onConnect }) => {
    const [sessions, setSessions] = useState<Session[]>([]);

    const loadSessions = async () => {
        // @ts-ignore
        const saved = await window.electron?.ipcRenderer.invoke('get-sessions');
        if (saved) setSessions(saved);
    };

    useEffect(() => {
        loadSessions();
        // Poll or listen for updates? For now just load once.
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this session?')) {
            // @ts-ignore
            await window.electron?.ipcRenderer.invoke('delete-session', id);
            loadSessions();
        }
    };

    return (
        <Container>
            <h3>Saved Sessions</h3>
            <SessionList>
                {sessions.length === 0 && <div style={{ opacity: 0.5 }}>No saved sessions</div>}
                {sessions.map(s => (
                    <SessionItem key={s.id} onClick={() => onConnect(s)}>
                        <div>
                            <strong>{s.label || s.host}</strong>
                            <div style={{ fontSize: '0.8em', opacity: 0.7 }}>{s.username}@{s.host}</div>
                        </div>
                        <DeleteBtn onClick={(e) => handleDelete(e, s.id)}>×</DeleteBtn>
                    </SessionItem>
                ))}
            </SessionList>
        </Container>
    );
};
