import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';
import { SessionModal } from './SessionModal';
import { Server, Folder, Plus, Terminal, Search } from 'lucide-react';

const DashboardContainer = styled.div`
  padding: ${theme.spacing.xl};
  height: 100%;
  overflow-y: auto;
  background-color: ${theme.colors.background};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
`;

const Title = styled.h1`
  margin: 0;
  color: ${theme.colors.foreground};
  font-size: 24px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: ${theme.colors.primary};
  color: ${theme.colors.background};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  &:hover { background-color: ${theme.colors.accent}; }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: ${theme.colors.backgroundLighter};
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 0 12px;
  width: 400px;
  margin-bottom: ${theme.spacing.xl};
  
  input {
    flex: 1;
    background: none;
    border: none;
    padding: 12px;
    color: ${theme.colors.foreground};
    font-size: 14px;
    &:focus { outline: none; }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const SessionCard = styled.div<{ color?: string }>`
  background-color: ${theme.colors.backgroundLighter};
  border: 1px solid ${theme.colors.border};
  border-top: 4px solid ${props => props.color || theme.colors.accent};
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    border-color: ${props => props.color || theme.colors.accent};
  }
`;

const SessionTitle = styled.div`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SessionInfo = styled.div`
  color: ${theme.colors.secondary};
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const GroupHeader = styled.h3`
  margin: 30px 0 15px 0;
  color: ${theme.colors.secondary};
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid ${theme.colors.border};
  padding-bottom: 5px;
`;

export const QuickConnect: React.FC<{ onConnect: (config: any) => void }> = ({ onConnect }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSession, setEditingSession] = useState<any>(null);

  const loadSessions = async () => {
    // @ts-ignore
    const saved = await window.electron?.ipcRenderer.invoke('get-sessions');
    if (saved) setSessions(saved);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSave = async (sessionData: any) => {
    const newSession = {
      ...sessionData,
      id: sessionData.id || Math.random().toString(36).substring(7)
    };
    // @ts-ignore
    await window.electron?.ipcRenderer.invoke('save-session', newSession);
    loadSessions();
    setIsModalOpen(false);
  };

  const handleEdit = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const filteredSessions = sessions.filter(s =>
    (s.label || s.host).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by 'group' field
  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const group = session.group || 'Uncategorized';
    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <DashboardContainer>
      <Header>
        <Title>Sessions</Title>
        <AddButton onClick={() => { setEditingSession(null); setIsModalOpen(true); }}>
          <Plus size={18} /> New Session
        </AddButton>
      </Header>

      <SearchBar>
        <Search size={18} color={theme.colors.secondary} />
        <input
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </SearchBar>

      {Object.entries(groupedSessions).map((entry: any) => {
        const [group, groupSessions] = entry;
        return (
          <div key={group}>
            <GroupHeader><Folder size={16} /> {group}</GroupHeader>
            <Grid>
              {groupSessions.map((session: any) => (
                <SessionCard
                  key={session.id}
                  color={session.color}
                  onClick={() => onConnect(session)}
                  onContextMenu={(e) => handleEdit(e, session)}
                >
                  <SessionTitle>
                    <Terminal size={16} />
                    {session.label || session.host}
                  </SessionTitle>
                  <SessionInfo>{session.username}@{session.host}:{session.port}</SessionInfo>
                </SessionCard>
              ))}
            </Grid>
          </div>
        );
      })}

      {sessions.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 50, color: theme.colors.secondary }}>
          <p>No sessions found. Create your first one!</p>
        </div>
      )}

      <SessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingSession}
      />
    </DashboardContainer>
  );
};
