'use client';

import { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { FiX, FiSave, FiPlus, FiMove } from 'react-icons/fi';
import api from '../../utils/api';
import { useLanguage } from '../../../context/LanguageContext';

interface Category {
    _id: string;
    name: string | { en: string; hi: string };
    slug: string;
    imageUrl: string;
    displayOrder: number;
    productCount: number;
}

interface ReorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategories: Category[];
    onSaveSuccess: () => void;
    onAddCategory: () => void;
}

export default function ReorderModal({
    isOpen,
    onClose,
    initialCategories,
    onSaveSuccess,
    onAddCategory
}: ReorderModalProps) {
    const [items, setItems] = useState<Category[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [prevInitial, setPrevInitial] = useState<Category[]>([]);

    const { language } = useLanguage();

    useEffect(() => {
        if (!isOpen) {
            setItems([]);
            setHasChanges(false);
            setPrevInitial([]);
            document.body.style.overflow = 'unset';
            return;
        }

        document.body.style.overflow = 'hidden';

        if (prevInitial.length === 0) {
            // Initial load when opening
            const sorted = [...initialCategories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setItems(sorted);
            setHasChanges(false);
            setPrevInitial(initialCategories);
        } else if (initialCategories.length > prevInitial.length) {
            // Something was added while modal was open
            const added = initialCategories.filter(c => !prevInitial.find(p => p._id === c._id));
            if (added.length > 0) {
                setItems(prev => [...prev, ...added]);
                setHasChanges(true);
                setPrevInitial(initialCategories);
            }
        }
    }, [isOpen, initialCategories]);

    const handleReorder = (newOrder: Category[]) => {
        setItems(newOrder);
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const orderPayload = items.map((item, index) => ({
                id: item._id,
                position: index + 1
            }));
            await api.post('/admin/categories/reorder', { order: orderPayload });
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save order', error);
            alert('Failed to save category order. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const getName = (name: string | { en: string; hi: string }) => {
        if (typeof name === 'string') return name;
        return name[language] || name['en'];
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
        }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    if (hasChanges && !confirm('You have unsaved changes. Close anyway?')) return;
                    onClose();
                }
            }}>
            <div style={{
                background: 'white',
                width: '100%',
                maxWidth: '1200px',
                maxHeight: '90vh',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Reorder Categories</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                            <span style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>Preview Mode</span>
                            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Drag tiles to reorder. Changes apply only after saving.</span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (hasChanges && !confirm('You have unsaved changes. Close anyway?')) return;
                            onClose();
                        }}
                        style={{
                            background: '#f8fafc',
                            border: 'none',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem 2.5rem',
                    background: '#f8fafc'
                }}>
                    <Reorder.Group
                        axis="y"
                        values={items}
                        onReorder={handleReorder}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            padding: '0.5rem',
                            listStyleType: 'none'
                        }}
                    >
                        {items.map((category) => (
                            <Reorder.Item
                                key={category._id}
                                value={category}
                                style={{ position: 'relative' }}
                            >
                                <div
                                    className="reorder-row"
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '0.75rem 1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1.5rem',
                                        border: hasChanges ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                                        cursor: 'grab',
                                        transition: 'all 0.2s ease',
                                        userSelect: 'none'
                                    }}
                                    onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                                    onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                                >
                                    {/* Drag Handle & Position */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '60px' }}>
                                        <div style={{ color: '#cbd5e1' }}><FiMove size={18} /></div>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#0f172a',
                                            color: 'white',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800
                                        }}>
                                            {items.indexOf(category) + 1}
                                        </div>
                                    </div>

                                    {/* Thumbnail Preview */}
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        background: '#f1f5f9',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        {category.imageUrl ? (
                                            <img
                                                src={category.imageUrl.startsWith('http') ? category.imageUrl : `/api/${category.imageUrl.startsWith('/') ? category.imageUrl.slice(1) : category.imageUrl}`}
                                                alt={getName(category.name)}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '1.2rem' }}>📦</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '0.95rem',
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            margin: 0,
                                            lineHeight: 1.2
                                        }}>{getName(category.name)}</h3>
                                        <p style={{
                                            fontSize: '0.75rem',
                                            color: '#64748b',
                                            margin: '0.2rem 0 0 0',
                                            fontWeight: 500
                                        }}>{category.slug}</p>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            background: '#eff6ff',
                                            color: '#3b82f6',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px'
                                        }}>
                                            {category.productCount} Products
                                        </span>
                                    </div>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem 2rem',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white'
                }}>
                    <button
                        onClick={onAddCategory}
                        className="btn-add-inline"
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #e2e8f0',
                            background: 'white',
                            color: '#475569',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
                    >
                        <FiPlus size={18} /> Add New Category
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                fontWeight: 700,
                                padding: '0.75rem 1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Discard
                        </button>
                        <button
                            disabled={!hasChanges || isSaving}
                            onClick={handleSave}
                            style={{
                                padding: '0.75rem 2.5rem',
                                borderRadius: '12px',
                                border: 'none',
                                background: hasChanges ? '#F37021' : '#f1f5f9',
                                color: hasChanges ? 'white' : '#94a3b8',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: hasChanges ? 'pointer' : 'not-allowed',
                                boxShadow: hasChanges ? '0 10px 15px -3px rgba(243, 112, 33, 0.3)' : 'none',
                                transition: 'all 0.2s',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            {isSaving ? (
                                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            ) : (
                                <FiSave size={18} />
                            )}
                            {isSaving ? 'Saving...' : 'Apply New Order'}
                        </button>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes modalSlideUp {
                        from { opacity: 0; transform: translateY(40px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    .reorder-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                        border-color: #F37021 !important;
                    }
                    .reorder-card:active {
                        cursor: grabbing;
                        scale: 1.05;
                        z-index: 100;
                    }
                `}</style>
            </div>
        </div>
    );
}
