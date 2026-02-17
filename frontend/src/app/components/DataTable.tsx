import { useState, useMemo } from 'react';
import styles from './DataTable.module.css';
import { FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    sortable?: boolean;
    className?: string; // Optional custom class for the cell
}

interface FilterOption {
    label: string;
    value: string;
}

interface Filter<T> {
    key: keyof T;
    label: string;
    options?: FilterOption[]; // If provided, shows a dropdown. If not, maybe ignored for now.
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title?: string;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    searchable?: boolean;
    searchKeys?: (keyof T)[]; // Keys to search in
    filterable?: boolean; // Enable column-based filtering (basic implementation)
    loading?: boolean;
    itemsPerPage?: number;
}

export default function DataTable<T extends { _id?: string; id?: string }>({
    data,
    columns,
    title,
    onEdit,
    onDelete,
    searchable = true,
    searchKeys,
    loading = false,
    itemsPerPage = 10,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null);

    // Filter and Sort Data
    const processedData = useMemo(() => {
        let result = [...data];

        // Search
        if (searchTerm && searchKeys && searchKeys.length > 0) {
            result = result.filter((item) =>
                searchKeys.some((key) => {
                    const val = item[key];
                    if (val == null) return false;
                    return String(val).toLowerCase().includes(searchTerm.toLowerCase());
                })
            );
        }

        // Sort
        if (sortConfig) {
            result.sort((a, b) => {
                // Handle complex accessors if they are functions? (Not handled in simple sortConfig without more logic, 
                // assuming sort keys map to direct properties for simplicity or custom logic needed)
                // For now, only sort by direct properties
                const valA = a[sortConfig.key as keyof T];
                const valB = b[sortConfig.key as keyof T];

                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [data, searchTerm, searchKeys, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const paginatedData = processedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleSort = (key: keyof T | string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.emptyState}>Loading...</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {title || "Data Table"} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '0.5rem', fontWeight: 400 }}>({data.length})</span>
                </div>
                <div className={styles.controls}>
                    {searchable && (
                        <div className={styles.searchContainer}>
                            <FiSearch className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className={styles.search}
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    onClick={() => col.sortable && typeof col.accessor !== 'function' ? handleSort(col.accessor as string) : null}
                                    style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {col.header}
                                        {sortConfig && sortConfig.key === col.accessor && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {(onEdit || onDelete) && <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, rowIdx) => (
                                <tr key={(item._id || item.id || rowIdx).toString()}>
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className={col.className}>
                                            {typeof col.accessor === 'function' ? (
                                                col.accessor(item)
                                            ) : (
                                                item[col.accessor] as React.ReactNode
                                            )}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td style={{ textAlign: 'center' }}>
                                            <div className={styles.actions} style={{ justifyContent: 'center' }}>
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(item)}
                                                        className={styles.btnIcon}
                                                        style={{ color: 'var(--primary)', background: 'rgba(243, 112, 33, 0.1)' }}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(item)}
                                                        className={styles.btnIcon}
                                                        style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                                    className={styles.emptyState}
                                >
                                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <FiSearch size={24} color="var(--text-muted)" />
                                        <span>No records found matching your search.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <div className={styles.pageInfo}>
                        Showing <span style={{ fontWeight: 600 }}>{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span style={{ fontWeight: 600 }}>
                            {Math.min(currentPage * itemsPerPage, processedData.length)}
                        </span>{' '}
                        of <span style={{ fontWeight: 600 }}>{processedData.length}</span> entries
                    </div>
                    <div className={styles.pageButtons}>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <FiChevronLeft />
                        </button>

                        {(() => {
                            const pages = [];
                            for (let i = 1; i <= totalPages; i++) {
                                if (
                                    i === 1 ||
                                    i === totalPages ||
                                    (i >= currentPage - 1 && i <= currentPage + 1)
                                ) {
                                    pages.push(i);
                                }
                            }

                            // Deduplicate and sort (just incase)
                            const uniquePages = Array.from(new Set(pages)).sort((a, b) => a - b);

                            const renderedPages = [];
                            for (let i = 0; i < uniquePages.length; i++) {
                                const p = uniquePages[i];
                                if (i > 0 && p - uniquePages[i - 1] > 1) {
                                    renderedPages.push(
                                        <span key={`ellipsis-${p}`} style={{ padding: '0.375rem 0.5rem', color: 'var(--text-muted)' }}>...</span>
                                    );
                                }
                                renderedPages.push(
                                    <button
                                        key={p}
                                        className={`${styles.pageBtn} ${currentPage === p ? styles.active : ''}`}
                                        onClick={() => setCurrentPage(p)}
                                        style={currentPage === p ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' } : {}}
                                    >
                                        {p}
                                    </button>
                                );
                            }
                            return renderedPages;
                        })()}

                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
