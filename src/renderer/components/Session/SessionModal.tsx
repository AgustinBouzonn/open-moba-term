import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';
import { X, Save, Server, Shield, Palette } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled.div`
  width: 800px;
  height: 600px;
  background-color: ${theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${theme.colors.border};
`;

const ModalHeader = styled.div`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  background-color: ${theme.colors.backgroundLighter};
  
  h3 { margin: 0; color: ${theme.colors.foreground}; }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.foreground};
  cursor: pointer;
  &:hover { color: ${theme.colors.danger}; }
`;

const ModalBody = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 200px;
  background-color: ${theme.colors.backgroundDark};
  border-right: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.md} 0;
`;

const SidebarItem = styled.div<{ active: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${props => props.active ? theme.colors.accent : theme.colors.foreground};
  background-color: ${props => props.active ? theme.colors.background + '40' : 'transparent'};
  border-left: 3px solid ${props => props.active ? theme.colors.accent : 'transparent'};
  
  &:hover {
    background-color: ${theme.colors.backgroundLighter};
  }
`;

const ContentPanel = styled.div`
  flex: 1;
  padding: ${theme.spacing.xl};
  overflow-y: auto;
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.secondary};
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background-color: ${theme.colors.backgroundDark};
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  color: ${theme.colors.foreground};
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  background-color: ${theme.colors.backgroundDark};
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  color: ${theme.colors.foreground};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  background-color: ${props => props.variant === 'secondary' ? 'transparent' : theme.colors.primary};
  border: ${props => props.variant === 'secondary' ? `1px solid ${theme.colors.border}` : 'none'};
  color: ${props => props.variant === 'secondary' ? theme.colors.foreground : theme.colors.background};
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  
  &:hover {
    background-color: ${props => props.variant === 'secondary' ? theme.colors.backgroundLighter : theme.colors.accent};
  }
`;

const Footer = styled.div`
  height: 60px;
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 ${theme.spacing.xl};
  gap: ${theme.spacing.md};
  background-color: ${theme.colors.backgroundLighter};
`;

interface SessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (session: any) => void;
    initialData?: any;
}

export const SessionModal: React.FC<SessionModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState<any>({
        label: '',
        host: '',
        port: 22,
        username: 'root',
        authType: 'password',
        password: '',
        privateKeyPath: '',
        group: '',
        color: theme.colors.accent,
        icon: 'terminal',
        protocol: 'ssh'
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({ ...formData, ...initialData });
        } else if (isOpen) {
            // Reset
            setFormData({
                label: '',
                host: '',
                port: 22,
                username: 'root',
                authType: 'password',
                password: '',
                privateKeyPath: '',
                group: '',
                color: theme.colors.accent,
                icon: 'terminal',
                protocol: 'ssh'
            });
        }
    }, [isOpen, initialData]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.host) return alert('Host is required');
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <h3>{initialData ? 'Edit Session' : 'New Session'}</h3>
                    <CloseButton onClick={onClose}><X size={20} /></CloseButton>
                </ModalHeader>

                <ModalBody>
                    <Sidebar>
                        <SidebarItem active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                            <Server size={16} /> General
                        </SidebarItem>
                        <SidebarItem active={activeTab === 'ssh'} onClick={() => setActiveTab('ssh')}>
                            <Shield size={16} /> {formData.protocol === 'ssh' ? 'SSH Settings' : 'Credentials'}
                        </SidebarItem>
                        <SidebarItem active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')}>
                            <Palette size={16} /> Appearance
                        </SidebarItem>
                    </Sidebar>

                    <ContentPanel>
                        {activeTab === 'general' && (
                            <>
                                <FormGroup>
                                    <Label>Protocol</Label>
                                    <Select value={formData.protocol || 'ssh'} onChange={e => handleChange('protocol', e.target.value)}>
                                        <option value="ssh">SSH (Secure Shell)</option>
                                        <option value="vnc">VNC (Remote Desktop)</option>
                                        <option value="rdp">RDP (Remote Desktop Protocol)</option>
                                    </Select>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Session Name</Label>
                                    <Input value={formData.label} onChange={e => handleChange('label', e.target.value)} placeholder="My Production Server" />
                                </FormGroup>
                                <div style={{ display: 'flex', gap: 20 }}>
                                    <FormGroup style={{ flex: 3 }}>
                                        <Label>Host / IP</Label>
                                        <Input value={formData.host} onChange={e => handleChange('host', e.target.value)} placeholder="192.168.1.1" />
                                    </FormGroup>
                                    <FormGroup style={{ flex: 1 }}>
                                        <Label>Port</Label>
                                        <Input type="number" value={formData.port} onChange={e => handleChange('port', parseInt(e.target.value))} />
                                    </FormGroup>
                                </div>
                                <FormGroup>
                                    <Label>Group / Folder</Label>
                                    <Input value={formData.group} onChange={e => handleChange('group', e.target.value)} placeholder="Production/Databases" />
                                </FormGroup>
                            </>
                        )}

                        {activeTab === 'ssh' && (
                            <>
                                {formData.protocol === 'vnc' ? (
                                    <FormGroup>
                                        <Label>VNC Password</Label>
                                        <Input type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} />
                                    </FormGroup>
                                ) : formData.protocol === 'rdp' ? (
                                    <>
                                        <FormGroup>
                                            <Label>Username</Label>
                                            <Input value={formData.username} onChange={e => handleChange('username', e.target.value)} />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Password</Label>
                                            <Input type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Domain (Optional)</Label>
                                            <Input value={formData.domain || ''} onChange={e => handleChange('domain', e.target.value)} />
                                        </FormGroup>
                                    </>
                                ) : (
                                    <>
                                        <FormGroup>
                                            <Label>Username</Label>
                                            <Input value={formData.username} onChange={e => handleChange('username', e.target.value)} />
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Authentication Method</Label>
                                            <Select value={formData.authType} onChange={e => handleChange('authType', e.target.value)}>
                                                <option value="password">Password</option>
                                                <option value="key">Private Key</option>
                                            </Select>
                                        </FormGroup>
                                        {formData.authType === 'password' && (
                                            <FormGroup>
                                                <Label>Password</Label>
                                                <Input type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} />
                                            </FormGroup>
                                        )}
                                        {formData.authType === 'key' && (
                                            <FormGroup>
                                                <Label>Private Key Path</Label>
                                                <Input value={formData.privateKeyPath} onChange={e => handleChange('privateKeyPath', e.target.value)} placeholder="C:/Users/me/.ssh/id_rsa" />
                                            </FormGroup>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {activeTab === 'appearance' && (
                            <>
                                <FormGroup>
                                    <Label>Tab Color</Label>
                                    <Input type="color" value={formData.color} onChange={e => handleChange('color', e.target.value)} style={{ height: 40 }} />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Icon</Label>
                                    <Select value={formData.icon} onChange={e => handleChange('icon', e.target.value)}>
                                        <option value="terminal">Terminal</option>
                                        <option value="server">Server</option>
                                        <option value="database">Database</option>
                                        <option value="cloud">Cloud</option>
                                    </Select>
                                </FormGroup>
                            </>
                        )}
                    </ContentPanel>
                </ModalBody>

                <Footer>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}><Save size={16} style={{ marginBottom: -3, marginRight: 5 }} /> Save Session</Button>
                </Footer>
            </ModalContainer>
        </Overlay>
    );
};
