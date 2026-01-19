import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';
import { Activity, HardDrive, Cpu, Clock } from 'lucide-react';

const Container = styled.div`
    height: 28px;
    background-color: ${theme.colors.backgroundDark};
    border-top: 1px solid ${theme.colors.border};
    display: flex;
    align-items: center;
    padding: 0 ${theme.spacing.md};
    gap: ${theme.spacing.xl};
    font-size: 11px;
    color: ${theme.colors.secondary};
    flex-shrink: 0;
`;

const Item = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 100px;
`;

const Label = styled.span`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const BarContainer = styled.div`
    flex: 1;
    height: 6px;
    background-color: ${theme.colors.background};
    border-radius: 3px;
    overflow: hidden;
    min-width: 60px;
    position: relative;
    border: 1px solid ${theme.colors.border};
`;

const BarFill = styled.div<{ percent: number, color?: string }>`
    width: ${props => props.percent}%;
    height: 100%;
    background-color: ${props => props.color || theme.colors.primary};
    transition: width 0.3s ease;
`;

interface Stats {
    cpu: number;
    ramTotal: number;
    ramUsed: number;
    disk: string; // e.g "45%"
    uptime: string;
}

export const SystemStatusBar: React.FC<{ stats: Stats | null }> = ({ stats }) => {
    if (!stats) {
        return (
            <Container>
                <span style={{ opacity: 0.5 }}>Waiting for system stats...</span>
            </Container>
        );
    }

    const ramPercent = stats.ramTotal > 0 ? (stats.ramUsed / stats.ramTotal) * 100 : 0;
    const diskPercent = parseInt(stats.disk) || 0;

    // Determine colors based on thresholds
    const getCpuColor = (p: number) => p > 90 ? theme.colors.danger : (p > 70 ? 'orange' : theme.colors.accent);
    const getRamColor = (p: number) => p > 90 ? theme.colors.danger : theme.colors.primary;

    return (
        <Container>
            <Item>
                <Label><Clock size={12} /> Uptime</Label>
                <span>{stats.uptime.replace('up ', '')}</span>
            </Item>

            <Item>
                <Label><Cpu size={12} /> CPU</Label>
                <BarContainer title={`${stats.cpu.toFixed(1)}%`}>
                    <BarFill percent={stats.cpu} color={getCpuColor(stats.cpu)} />
                </BarContainer>
                <span>{stats.cpu.toFixed(0)}%</span>
            </Item>

            <Item>
                <Label><Activity size={12} /> RAM</Label>
                <BarContainer title={`${stats.ramUsed}MB / ${stats.ramTotal}MB`}>
                    <BarFill percent={ramPercent} color={getRamColor(ramPercent)} />
                </BarContainer>
                <span>{ramPercent.toFixed(0)}%</span>
            </Item>

            <Item>
                <Label><HardDrive size={12} /> Disk</Label>
                <BarContainer title={stats.disk}>
                    <BarFill percent={diskPercent} color={theme.colors.secondary} />
                </BarContainer>
                <span>{stats.disk}</span>
            </Item>
        </Container>
    );
};
