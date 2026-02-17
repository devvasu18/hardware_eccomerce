'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiPlus, FiTrash2, FiEdit2, FiMove, FiEye, FiEyeOff, FiSave, FiX, FiCheck } from 'react-icons/fi';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import './home-builder.css';

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

// Types
interface HomeLayoutItem {
    _id: string;
    componentType: string;
    config: any;
    order: number;
    isActive: boolean;
}

interface Category {
    _id: string;
    name: string;
}

const COMPONENT_TYPES = [
    { type: 'HERO_SLIDER', name: 'Hero Main Slider', icon: '🖼️' },
    { type: 'CATEGORIES', name: 'Categories Circle Slider', icon: '🔵' },
    { type: 'BRANDS', name: 'Brand Partners Grid', icon: '🤝' },
    { type: 'FEATURED_PRODUCTS', name: 'Featured Products Grid', icon: '⭐' },
    { type: 'NEW_ARRIVALS', name: 'New Arrivals Slider', icon: '🆕' },
    { type: 'SPECIAL_OFFERS', name: 'Special Offers & Deals', icon: '🏷️' },
    { type: 'WHY_CHOOSE_US', name: 'Why Choose Us / Trust Badges', icon: '�️' },
    { type: 'CATEGORY_PRODUCTS', name: 'Category Product Listing', icon: '📦' },
    { type: 'FLASH_SALE', name: 'Flash Sale Countdown', icon: '⚡' },
    { type: 'RECENTLY_VIEWED', name: 'Recently Viewed Products', icon: '👁️' },
    { type: 'RECOMMENDED', name: 'AI Recommended For You', icon: '�' },
    { type: 'DEAL_OF_THE_DAY', name: 'Deal of the Day', icon: '�' },
    { type: 'TESTIMONIALS', name: 'Customer Testimonials', icon: '💬' },
];

// Sortable Item Component
function SortableItem(props: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`component-card ${isDragging ? 'dragging' : ''}`}
        >
            <div className="component-info">
                <div className="drag-handle" {...attributes} {...listeners}>
                    <FiMove size={18} />
                </div>
                <div className="component-icon">
                    {props.icon}
                </div>
                <div className="component-details">
                    <span className="component-name">{props.name}</span>
                    <div className="component-meta">
                        <span className={`component-status status-${props.isActive ? 'active' : 'inactive'}`}>
                            {props.isActive ? 'Active' : 'Hidden'}
                        </span>
                        {props.componentType === 'CATEGORY_PRODUCTS' && props.config?.categoryName && (
                            <span className="config-tag">
                                {props.config.categoryName}
                            </span>
                        )}
                        {/* Add more config tags here for other components if needed */}
                    </div>
                </div>
            </div>

            <div className="component-controls">
                <button
                    className="btn-icon"
                    onClick={() => props.onToggle(props._id, !props.isActive)}
                    title={props.isActive ? "Hide Component" : "Show Component"}
                >
                    {props.isActive ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                </button>
                <button
                    className="btn-icon"
                    onClick={() => props.onEdit(props.item)}
                    title="Configure Component"
                >
                    <FiEdit2 size={18} />
                </button>
                <button
                    className="btn-icon delete"
                    onClick={() => props.onDelete(props._id)}
                    title="Remove Component"
                >
                    <FiTrash2 size={18} />
                </button>
            </div>
        </div>
    );
}

export default function HomeBuilder() {
    const [layout, setLayout] = useState<HomeLayoutItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Config Modal State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<HomeLayoutItem | null>(null);
    const [tempConfig, setTempConfig] = useState<any>({});

    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchLayout();
        fetchCategories();
    }, []);

    const fetchLayout = async () => {
        try {
            const res = await api.get('/home-layout/admin');
            setLayout(res.data);
            setHasChanges(false);
        } catch (error) {
            console.error('Error fetching layout:', error);
            showError('Failed to load home layout');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories'); // Assuming this endpoint exists
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLayout((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
            setHasChanges(true); // Reordering counts as a change that needs saving
        }
    };

    const handleAddComponent = async (type: string) => {
        try {
            const newItem = {
                componentType: type,
                config: {},
                order: layout.length + 1,
                isActive: true
            };
            const res = await api.post('/home-layout/admin', newItem);
            setLayout([...layout, res.data]);
            showSuccess('Component added successfully');

            // If it needs config, open modal immediately
            if (type === 'CATEGORY_PRODUCTS') {
                setEditingItem(res.data);
                setTempConfig({});
                setIsConfigOpen(true);
            }
            setIsAddModalOpen(false);

        } catch (error) {
            showError('Failed to add component');
        }
    };

    const handleDelete = (id: string) => {
        showModal(
            'Delete Component',
            'Are you sure you want to remove this component from the home page?',
            'warning',
            {
                showCancel: true,
                confirmText: 'Yes, Remove',
                onConfirm: async () => {
                    try {
                        await api.delete(`/home-layout/admin/${id}`);
                        setLayout(layout.filter(item => item._id !== id));
                        showSuccess('Component removed');
                    } catch (error) {
                        showError('Failed to remove component');
                    }
                }
            }
        );
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        // Optimistic update
        const updatedLayout = layout.map(item => item._id === id ? { ...item, isActive } : item);
        setLayout(updatedLayout);

        try {
            await api.put(`/home-layout/admin/${id}`, { isActive });
        } catch (error) {
            // Revert on fail
            setLayout(layout);
            showError('Failed to update status');
        }
    };

    const handleEdit = (item: HomeLayoutItem) => {
        setEditingItem(item);
        setTempConfig(item.config || {});
        setIsConfigOpen(true);
    };

    const handleConfigSave = async () => {
        if (!editingItem) return;

        // Validation for CATEGORY_PRODUCTS
        if (editingItem.componentType === 'CATEGORY_PRODUCTS' && !tempConfig.categoryId) {
            alert('Please select a category');
            return;
        }

        // Add category name for display purposes ifcategoryId is changing
        if (tempConfig.categoryId) {
            const selectedCat = categories.find(c => c._id === tempConfig.categoryId);
            if (selectedCat) {
                tempConfig.categoryName = selectedCat.name;
            }
        }

        try {
            const res = await api.put(`/home-layout/admin/${editingItem._id}`, { config: tempConfig });
            setLayout(layout.map(item => item._id === editingItem._id ? res.data : item));

            setIsConfigOpen(false);
            setEditingItem(null);
            showSuccess('Configuration saved');
        } catch (error) {
            showError('Failed to save configuration');
        }
    };

    const saveOrder = async () => {
        try {
            const orderPayload = layout.map((item, index) => ({
                id: item._id,
                order: index + 1
            }));

            await api.put('/home-layout/admin/reorder', { orders: orderPayload });
            setHasChanges(false);
            showSuccess('Home page layout saved successfully');
        } catch (error) {
            showError('Failed to save layout order');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Home Builder...</div>;

    return (
        <div className="home-builder-container">
            <Modal
                isOpen={modalState.isOpen}
                onClose={hideModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
                showCancel={modalState.showCancel}
            />

            {/* Config Modal */}
            {isConfigOpen && editingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">
                                Configure {COMPONENT_TYPES.find(t => t.type === editingItem.componentType)?.name}
                            </h3>
                            <button onClick={() => setIsConfigOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {editingItem.componentType === 'CATEGORY_PRODUCTS' ? (
                                <div className="config-modal-body">
                                    <div className="form-group">
                                        <label>Select Category</label>
                                        <select
                                            value={tempConfig.categoryId || ''}
                                            onChange={(e) => setTempConfig({ ...tempConfig, categoryId: e.target.value })}
                                        >
                                            <option value="">-- Choose Category --</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Sort By</label>
                                        <select
                                            value={tempConfig.sortBy || 'newest'}
                                            onChange={(e) => setTempConfig({ ...tempConfig, sortBy: e.target.value })}
                                        >
                                            <option value="newest">Newest Arrivals</option>
                                            <option value="most_viewed">Most Viewed</option>
                                            <option value="most_purchased">Best Sellers</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Product Limit</label>
                                        <input
                                            type="number"
                                            min="4"
                                            max="12"
                                            value={tempConfig.limit || 4}
                                            onChange={(e) => setTempConfig({ ...tempConfig, limit: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No specific configuration available for this component yet.</p>
                                    <p className="text-sm mt-2">Visibility and ordering can be managed from the main list.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsConfigOpen(false)}
                                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfigSave}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <FiCheck /> Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="builder-header">
                <div className="builder-title">
                    <h1>Home Page Builder</h1>
                    <p className="text-gray-500">Drag to reorder components, toggle visibility, or add new sections.</p>
                </div>
                <div className="builder-actions">
                    {hasChanges && (
                        <>
                            <button onClick={() => {
                                localStorage.setItem('admin_home_preview', JSON.stringify(layout));
                                window.open('/admin/home-builder/preview', '_blank');
                            }} className="builder-btn builder-btn-warning">
                                <FiEye /> Preview Changes
                            </button>
                            <button onClick={saveOrder} className="builder-btn builder-btn-success">
                                <FiSave /> Save Reordering
                            </button>
                        </>
                    )}
                    <button type="button" onClick={() => { console.log('Opening Add Component Modal'); setIsAddModalOpen(true); }} className="builder-btn builder-btn-primary">
                        <FiPlus /> Add Component
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={layout.map(i => i._id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="component-list">
                        {layout.map((item) => (
                            <SortableItem
                                key={item._id}
                                id={item._id}
                                _id={item._id}
                                item={item}
                                config={item.config}
                                name={COMPONENT_TYPES.find(t => t.type === item.componentType)?.name || item.componentType}
                                icon={COMPONENT_TYPES.find(t => t.type === item.componentType)?.icon || '🧩'}
                                isActive={item.isActive}
                                componentType={item.componentType}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add Component Modal */}
            {isAddModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999
                    }}
                    onClick={() => setIsAddModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl overflow-hidden"
                        style={{
                            width: '90%',
                            maxWidth: '900px',
                            maxHeight: '90vh',
                            backgroundColor: '#ffffff',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: '16px 24px',
                                borderBottom: '1px solid #f3f4f6',
                                backgroundColor: '#f9fafb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexShrink: 0,
                                width: '100%'
                            }}
                        >
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                Select Component to Add
                            </h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    color: '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <div
                            style={{
                                padding: '24px',
                                overflowY: 'auto',
                                width: '100%'
                            }}
                            className="custom-scrollbar"
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: '16px',
                                    width: '100%'
                                }}
                            >
                                {COMPONENT_TYPES.map((comp) => (
                                    <div
                                        key={comp.type}
                                        onClick={() => handleAddComponent(comp.type)}
                                        style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px',
                                            padding: '24px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'white',
                                            transition: 'all 0.2s ease',
                                            textAlign: 'center',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.backgroundColor = '#eff6ff';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                            e.currentTarget.style.backgroundColor = 'white';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>
                                            {comp.icon}
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                            {comp.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
