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

    const showSuccess = useCallback((message: string, title: string = 'Success', options?: Partial<Omit<ModalState, 'isOpen' | 'title' | 'message' | 'type'>>) => {
        showModal(title, message, 'success', options);
    }, [showModal]);

    const showError = useCallback((message: string, title: string = 'Error', options?: Partial<Omit<ModalState, 'isOpen' | 'title' | 'message' | 'type'>>) => {
        showModal(title, message, 'error', options);
    }, [showModal]);

    const showWarning = useCallback((message: string, title: string = 'Warning', options?: Partial<Omit<ModalState, 'isOpen' | 'title' | 'message' | 'type'>>) => {
        showModal(title, message, 'warning', options);
    }, [showModal]);

    const showInfo = useCallback((message: string, title: string = 'Information', options?: Partial<Omit<ModalState, 'isOpen' | 'title' | 'message' | 'type'>>) => {
        showModal(title, message, 'info', options);
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
