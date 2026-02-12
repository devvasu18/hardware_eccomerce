'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    FiPlus,
    FiSave,
    FiTrash2,
    FiMove,
    FiEye,
    FiEyeOff,
    FiEdit2,
    FiX,
    FiCheck,
    FiAlertCircle,
    FiLayers,
    FiShoppingBag,
    FiTag,
    FiClock,
    FiGrid,
    FiType,
    FiSearch
} from 'react-icons/fi';
import api from '@/app/utils/api';
import { COMPONENT_LIBRARY, ComponentDefinition } from '../../components/ComponentLibrary';
import '../../home-builder/home-builder.css'; // Reuse existing styles
import Link from 'next/link';

// Component for Sortable Item
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

    const compDef = COMPONENT_LIBRARY.find(c => c.type === props.componentType);

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
                    {compDef?.icon || <FiLayers />}
                </div>
                <div className="component-details">
                    <span className="component-name">{compDef?.name || props.componentType}</span>
                    <div className="component-meta">
                        <span className={`component-status status-${props.isActive ? 'active' : 'inactive'}`}>
                            {props.isActive ? 'Active' : 'Hidden'}
                        </span>
                        <span className="config-tag bg-gray-100 text-gray-500">
                            {compDef?.category}
                        </span>
                        {props.config?.title && (
                            <span className="config-tag font-medium" style={{ color: '#F37021' }}>
                                "{props.config.title}"
                            </span>
                        )}
                        {props.config?.categoryName && (
                            <span className="config-tag">
                                {props.config.categoryName}
                            </span>
                        )}
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

export default function PageBuilder({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const pageSlug = slug;
    const [layout, setLayout] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [insertIndex, setInsertIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Config state
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [tempConfig, setTempConfig] = useState<any>({});

    // Data for config (categories, brands etc)
    const [categories, setCategories] = useState<any[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchLayout();
        fetchCategories();
    }, [pageSlug]);

    const fetchLayout = async () => {
        try {
            // Using existing home-layout route but passing page query
            const response = await api.get(`/admin/home-layout?page=${pageSlug}`);
            setLayout(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching layout:', error);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/admin/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setHasChanges(true);
            setLayout((items) => {
                const oldIndex = items.findIndex((i) => i._id === active.id);
                const newIndex = items.findIndex((i) => i._id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const saveOrder = async () => {
        try {
            const orders = layout.map((item, index) => ({
                id: item._id,
                order: index + 1
            }));

            await api.put('/admin/home-layout/reorder', { orders });
            setHasChanges(false);
            // Show success toast (implement if toast available)
        } catch (error) {
            console.error('Error saving order:', error);
        }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            const updatedLayout = layout.map(item =>
                item._id === id ? { ...item, isActive } : item
            );
            setLayout(updatedLayout);
            await api.put(`/admin/home-layout/${id}`, { isActive });
        } catch (error) {
            console.error('Error updating status:', error);
            fetchLayout(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this component?')) return;

        try {
            await api.delete(`/admin/home-layout/${id}`);
            setLayout(layout.filter(item => item._id !== id));
        } catch (error) {
            console.error('Error deleting component:', error);
        }
    };

    const handleAddComponent = async (type: string) => {
        try {
            const definition = COMPONENT_LIBRARY.find(c => c.type === type);
            const initialConfig = definition?.defaultConfig || {};

            const response = await api.post('/admin/home-layout', {
                componentType: type,
                config: initialConfig,
                order: insertIndex !== null ? insertIndex + 1 : layout.length + 1,
                isActive: true,
                pageSlug: pageSlug
            });

            if (insertIndex !== null) {
                const newLayout = [...layout];
                newLayout.splice(insertIndex, 0, response.data);
                // Renumber orders
                const renumbered = newLayout.map((item, idx) => ({ ...item, order: idx + 1 }));
                setLayout(renumbered);
                setHasChanges(true);
            } else {
                setLayout([...layout, response.data]);
            }

            setIsAddModalOpen(false);
            setInsertIndex(null);

            // Open config immediately if needed
            if (['CATEGORY_PRODUCTS', 'FEATURED_PRODUCTS'].includes(type)) {
                handleEdit(response.data);
            }
        } catch (error) {
            console.error('Error adding component:', error);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setTempConfig(item.config || {});
        setIsConfigOpen(true);
    };

    const saveConfig = async () => {
        if (!editingItem) return;

        try {
            const response = await api.put(`/admin/home-layout/${editingItem._id}`, {
                config: tempConfig
            });

            setLayout(layout.map(item =>
                item._id === editingItem._id ? response.data : item
            ));

            setIsConfigOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Error saving config:', error);
        }
    };

    // Filter categories for the modal
    const componentStats = COMPONENT_LIBRARY.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categoriesList = ['All', ...Object.keys(componentStats)];

    const filteredComponents = COMPONENT_LIBRARY.filter(c => {
        const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="home-builder-container">
            <div className="builder-header">
                <div className="builder-title">
                    <h1>Page Builder: <span className="capitalize" style={{ color: '#F37021' }}>{pageSlug}</span></h1>
                    <p>Drag and drop to reorder components</p>
                </div>
                <div className="builder-actions">
                    {hasChanges && (
                        <>
                            {/* Preview specific to this page */}
                            <button onClick={() => {
                                localStorage.setItem(`admin_preview_${pageSlug}`, JSON.stringify(layout));
                                window.open(`/admin/page-builder/${pageSlug}/preview`, '_blank');
                            }} className="builder-btn builder-btn-warning">
                                <FiEye /> Preview
                            </button>
                            <button onClick={saveOrder} className="builder-btn builder-btn-success">
                                <FiSave /> Save Reordering
                            </button>
                        </>
                    )}
                    <button type="button" onClick={() => { setInsertIndex(null); setIsAddModalOpen(true); }} className="builder-btn builder-btn-primary">
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
                        {layout.map((item, index) => (
                            <React.Fragment key={item._id}>
                                {/* Insertion Point Before */}
                                {index === 0 && (
                                    <div className="insert-point-container">
                                        <button
                                            className="insert-point-btn"
                                            onClick={() => { setInsertIndex(0); setIsAddModalOpen(true); }}
                                            title="Insert component here"
                                        >
                                            <FiPlus />
                                        </button>
                                    </div>
                                )}

                                <SortableItem
                                    id={item._id}
                                    _id={item._id}
                                    item={item}
                                    config={item.config}
                                    componentType={item.componentType}
                                    isActive={item.isActive}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />

                                {/* Insertion Point After */}
                                <div className="insert-point-container">
                                    <button
                                        className="insert-point-btn"
                                        onClick={() => { setInsertIndex(index + 1); setIsAddModalOpen(true); }}
                                        title="Insert component here"
                                    >
                                        <FiPlus />
                                    </button>
                                </div>
                            </React.Fragment>
                        ))}

                        {layout.length === 0 && !loading && (
                            <div className="text-center p-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-4">This page is empty.</p>
                                <button onClick={() => { setInsertIndex(null); setIsAddModalOpen(true); }} className="font-medium hover:underline" style={{ color: '#F37021' }}>
                                    Add your first component
                                </button>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Config Modal */}
            {isConfigOpen && (
                <div className="modal-overlay" onClick={() => setIsConfigOpen(false)}>
                    <div
                        className="config-modal-premium max-w-lg animate-scale-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="config-header-premium">
                            <h3>Configure Component</h3>
                            <button className="config-close-btn" onClick={() => setIsConfigOpen(false)}>
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="config-body-premium">
                            {/* Basic Config */}
                            <div className="form-field-premium">
                                <label>Section Title</label>
                                <input
                                    type="text"
                                    className="input-premium"
                                    value={tempConfig.title || ''}
                                    onChange={e => setTempConfig({ ...tempConfig, title: e.target.value })}
                                    placeholder="e.g. Featured Products"
                                />
                            </div>

                            <div className="form-field-premium">
                                <label>Section Subtitle</label>
                                <textarea
                                    className="input-premium min-h-[80px]"
                                    value={tempConfig.subtitle || ''}
                                    onChange={e => setTempConfig({ ...tempConfig, subtitle: e.target.value })}
                                    placeholder="Briefly describe this section..."
                                    rows={2}
                                />
                            </div>

                            {/* Category Specific Config */}
                            {editingItem?.componentType === 'CATEGORY_PRODUCTS' && (
                                <div className="form-field-premium">
                                    <label>Select Category</label>
                                    <select
                                        className="select-premium"
                                        value={tempConfig.categoryId || ''}
                                        onChange={e => {
                                            const cat = categories.find(c => c._id === e.target.value);
                                            setTempConfig({
                                                ...tempConfig,
                                                categoryId: e.target.value,
                                                categoryName: cat?.name,
                                                categorySlug: cat?.slug
                                            });
                                        }}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-slate-400">Products from this category will be featured in this section</p>
                                </div>
                            )}


                            {/* Limit Config */}
                            {['CATEGORY_PRODUCTS', 'NEW_ARRIVALS', 'FEATURED_PRODUCTS'].includes(editingItem?.componentType) && (
                                <div className="form-field-premium">
                                    <label>Number of Products to Display</label>
                                    <input
                                        type="number"
                                        className="input-premium"
                                        value={tempConfig.limit || 4}
                                        onChange={e => setTempConfig({ ...tempConfig, limit: parseInt(e.target.value) })}
                                        min="2" max="20"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">Recommended: 4 to 12 products</p>
                                </div>
                            )}

                            {/* Image Banner Config */}
                            {editingItem?.componentType === 'IMAGE_BANNER' && (
                                <>
                                    <div className="form-field-premium">
                                        <label>Banner Image URL</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={tempConfig.imageUrl || ''}
                                            onChange={e => setTempConfig({ ...tempConfig, imageUrl: e.target.value })}
                                            placeholder="https://example.com/banner.jpg"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-field-premium">
                                            <label>Overlay Title</label>
                                            <input
                                                type="text"
                                                className="input-premium"
                                                value={tempConfig.title || ''}
                                                onChange={e => setTempConfig({ ...tempConfig, title: e.target.value })}
                                                placeholder="e.g. SHOP NEW RELEASES"
                                            />
                                        </div>
                                        <div className="form-field-premium">
                                            <label>Button Text</label>
                                            <input
                                                type="text"
                                                className="input-premium"
                                                value={tempConfig.buttonText || ''}
                                                onChange={e => setTempConfig({ ...tempConfig, buttonText: e.target.value })}
                                                placeholder="e.g. Shop Now"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-field-premium">
                                        <label>Banner Subtitle</label>
                                        <textarea
                                            className="input-premium min-h-[60px]"
                                            value={tempConfig.subtitle || ''}
                                            onChange={e => setTempConfig({ ...tempConfig, subtitle: e.target.value })}
                                            placeholder="Briefly describe the promotion..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-field-premium">
                                            <label>Text Alignment</label>
                                            <select
                                                className="select-premium"
                                                value={tempConfig.contentPosition || 'center'}
                                                onChange={e => setTempConfig({ ...tempConfig, contentPosition: e.target.value })}
                                            >
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                        <div className="form-field-premium">
                                            <label>Banner Height</label>
                                            <input
                                                type="text"
                                                className="input-premium"
                                                value={tempConfig.height || '450px'}
                                                onChange={e => setTempConfig({ ...tempConfig, height: e.target.value })}
                                                placeholder="e.g. 450px or 100vh"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-field-premium flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <input
                                            type="checkbox"
                                            id="fullWidth"
                                            className="w-5 h-5 cursor-pointer" style={{ accentColor: '#F37021' }}
                                            checked={tempConfig.isFullWidth || false}
                                            onChange={e => setTempConfig({ ...tempConfig, isFullWidth: e.target.checked })}
                                        />
                                        <label htmlFor="fullWidth" className="m-0 font-bold text-gray-700 cursor-pointer">
                                            Full Width Banner (Expand to Screen Edges)
                                        </label>
                                    </div>
                                    <div className="form-field-premium">
                                        <label>Click-through Link</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={tempConfig.link || ''}
                                            onChange={e => setTempConfig({ ...tempConfig, link: e.target.value })}
                                            placeholder="/products?category=valves"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="config-footer-premium">
                            <button onClick={() => setIsConfigOpen(false)} className="btn-cancel-premium">
                                Cancel
                            </button>
                            <button onClick={saveConfig} className="btn-save-premium">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Add Component Modal with Categories */}
            {isAddModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div
                        className="builder-modal-container max-w-5xl max-h-85vh animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-premium flex items-center justify-between gap-4">
                            <div className="modal-header-title">
                                <h3>Add Component</h3>
                                <p>
                                    {insertIndex !== null
                                        ? `Inserting section at position ${insertIndex + 1}`
                                        : `Adding section to the end of the ${pageSlug} page`}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 flex-1 justify-end">
                                <div className="search-container-premium">
                                    <FiSearch className="search-icon-premium" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search components..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input-premium"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar Filters */}
                            <div className="w-64 bg-gray-50 border-r border-gray-100 p-6 overflow-y-auto">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Library Categories</h4>
                                <div className="space-y-1">
                                    {categoriesList.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`sidebar-category-btn ${activeCategory === cat ? 'active' : ''}`}
                                        >
                                            <span>{cat}</span>
                                            <span className="category-count">
                                                {cat === 'All' ? COMPONENT_LIBRARY.length : componentStats[cat]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredComponents.map((comp) => (
                                        <div
                                            key={comp.type}
                                            className="component-card-premium"
                                            onClick={() => handleAddComponent(comp.type)}
                                        >
                                            <div className="card-icon-wrapper">
                                                {comp.icon}
                                            </div>
                                            <h4>{comp.name}</h4>
                                            <p className="line-clamp-2">
                                                {comp.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {filteredComponents.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400 font-bold text-2xl">?</div>
                                        <h3 className="font-bold text-gray-800">No components found</h3>
                                        <p className="text-gray-500">Try searching for something else or check another category.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
