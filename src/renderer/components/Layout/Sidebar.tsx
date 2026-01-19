import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';
import { Terminal as TerminalIcon, Users as SessionsIcon, Settings as SettingsIcon } from 'lucide-react';

const SidebarContainer = styled.div`
  width: 60px;
  background: linear-gradient(180deg, ${theme.colors.backgroundDark} 0%, ${theme.colors.background} 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: ${theme.spacing.lg};
  border-right: 1px solid ${theme.colors.border};
`;

const IconWrapper = styled.div<{ active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: ${props => props.active ? theme.colors.primary : 'transparent'};
  color: ${props => props.active ? theme.colors.background : theme.colors.foreground};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.md};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.active ? `0 0 15px ${theme.colors.primary}60` : 'none'};

  &:hover {
    background-color: ${props => props.active ? theme.colors.primary : theme.colors.backgroundLighter};
    color: ${props => props.active ? theme.colors.background : theme.colors.accent};
    transform: translateY(-2px);
  }
`;

interface SidebarProps {
  activeTab: 'terminal' | 'sessions';
  onTabChange: (tab: 'terminal' | 'sessions') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <SidebarContainer>
      <IconWrapper active={activeTab === 'terminal'} onClick={() => onTabChange('terminal')} title="Terminal">
        <TerminalIcon size={20} />
      </IconWrapper>

      <div style={{ flex: 1 }} />

      <IconWrapper active={activeTab === 'sessions'} onClick={() => onTabChange('sessions')} title="Saved Sessions">
        <SessionsIcon size={20} />
      </IconWrapper>
    </SidebarContainer>
  );
};
