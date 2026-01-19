import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { X, Save, FileCode } from 'lucide-react';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
`;

const ModalContainer = styled.div`
    width: 80%;
    height: 80%;
    background-color: ${theme.colors.background};
    border-radius: 8px;
    border: 1px solid ${theme.colors.border};
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid ${theme.colors.border};
    background-color: ${theme.colors.backgroundDark};
    border-radius: 8px 8px 0 0;
`;

const Title = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: ${theme.colors.foreground};
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: ${theme.colors.secondary};
    cursor: pointer;
    &:hover { color: ${theme.colors.foreground}; }
`;

const EditorContent = styled.textarea`
    flex: 1;
    background-color: ${theme.colors.background};
    color: ${theme.colors.foreground};
    border: none;
    padding: 16px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    outline: none;

    &:focus {
        background-color: ${theme.colors.backgroundLighter};
    }
`;

const ModalFooter = styled.div`
    padding: 12px 16px;
    border-top: 1px solid ${theme.colors.border};
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background-color: ${theme.colors.backgroundDark};
    border-radius: 0 0 8px 8px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    
    background-color: ${props => props.variant === 'primary' ? theme.colors.accent : 'transparent'};
    color: ${props => props.variant === 'primary' ? theme.colors.background : theme.colors.foreground};
    border: ${props => props.variant === 'primary' ? 'none' : `1px solid ${theme.colors.border}`};

    &:hover {
        opacity: 0.9;
        background-color: ${props => props.variant === 'primary' ? theme.colors.accent : theme.colors.backgroundLighter};
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

interface FileEditorModalProps {
    filename: string;
    initialContent: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string) => Promise<void>;
}

export const FileEditorModal: React.FC<FileEditorModalProps> = ({ filename, initialContent, isOpen, onClose, onSave }) => {
    const [content, setContent] = useState(initialContent);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setContent(initialContent);
    }, [initialContent]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(content);
            // Optionally close or show success
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save file.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <Title><FileCode size={18} /> {filename}</Title>
                    <CloseButton onClick={onClose}><X size={20} /></CloseButton>
                </ModalHeader>
                <EditorContent
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    spellCheck={false}
                />
                <ModalFooter>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </ModalFooter>
            </ModalContainer>
        </ModalOverlay>
    );
};
