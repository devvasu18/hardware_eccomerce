import { useState, useCallback } from 'react';

export const useModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<any>(null);

    const openModal = useCallback((modalData?: any) => {
        if (modalData) setData(modalData);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setData(null);
    }, []);

    return { isOpen, openModal, closeModal, data };
};
