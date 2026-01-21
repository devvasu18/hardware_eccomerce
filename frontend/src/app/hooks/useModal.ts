'use client';

import { useState, useCallback } from 'react';

interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
}

export function useModal() {
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showModal = useCallback((
        title: string,
        message: string,
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        options?: {
            confirmText?: string;
            cancelText?: string;
            onConfirm?: () => void;
            showCancel?: boolean;
        }
    ) => {
        setModalState({
            isOpen: true,
            title,
            message,
            type,
            ...options
        });
    }, []);

    const hideModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showSuccess = useCallback((message: string, title: string = 'Success') => {
        showModal(title, message, 'success');
    }, [showModal]);

    const showError = useCallback((message: string, title: string = 'Error') => {
        showModal(title, message, 'error');
    }, [showModal]);

    const showWarning = useCallback((message: string, title: string = 'Warning') => {
        showModal(title, message, 'warning');
    }, [showModal]);

    const showInfo = useCallback((message: string, title: string = 'Information') => {
        showModal(title, message, 'info');
    }, [showModal]);

    return {
        modalState,
        showModal,
        hideModal,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
}
