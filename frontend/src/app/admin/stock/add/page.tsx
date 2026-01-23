"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import { FiPlus, FiTrash2, FiSave } from "react-icons/fi";
import { useRouter } from "next/navigation";

interface Product {
    _id: string;
    title: string;
    description: string;
    category?: { name: string };
    brand?: { name: string };
    opening_stock: number;
}

interface Party {
    _id: string;
    name: string;
}

export default function AddStockPage() {
    const router = useRouter();
    const [parties, setParties] = useState<Party[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRow, setActiveRow] = useState<number | null>(null);

    const { register, control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            party_id: "",
            bill_date: new Date().toISOString().split('T')[0],
            cgst: 0,
            sgst: 0,
            items: [{ product_id: "", product_name: "", qty: 1, unit_price: 0, total: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Watch for totals
    const items = watch("items");
    const cgst = watch("cgst");
    const sgst = watch("sgst");

    const totalAmount = items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.unit_price)), 0);
    const finalBill = totalAmount + Number(cgst) + Number(sgst);

    useEffect(() => {
        // Fetch Parties & Products for dropdowns
        const fetchData = async () => {
            const [pRes, prodRes] = await Promise.all([
                api.get('/admin/parties'),
                api.get('/admin/products')
            ]);
            setParties(pRes.data);
            setProducts(prodRes.data);
            setFilteredProducts(prodRes.data);
        };
        fetchData();
    }, []);

    // Filter products based on search
    useEffect(() => {
        if (!searchTerm) {
            setFilteredProducts(products);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredProducts(products.filter(p =>
                p.title.toLowerCase().includes(lower) ||
                p.category?.name.toLowerCase().includes(lower) ||
                p.brand?.name.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, products]);

    const selectProduct = (index: number, product: Product) => {
        setValue(`items.${index}.product_id`, product._id);
        setValue(`items.${index}.product_name`, product.title);
        setValue(`items.${index}.unit_price`, 0); // Reset price or maybe fetch MRP later?
        setActiveRow(null);
        setSearchTerm('');
    }

    const onSubmit = async (data: any) => {
        try {
            const cleanItems = data.items.map((item: any) => ({
                product_id: item.product_id,
                qty: Number(item.qty),
                unit_price: Number(item.unit_price)
            }));

            const payload = {
                party_id: data.party_id,
                bill_date: data.bill_date,
                cgst: Number(data.cgst),
                sgst: Number(data.sgst),
                items: cleanItems
            };

            await api.post('/admin/stock', payload);
            alert('Stock Entry Created Successfully!');
            router.push('/admin/stock');
        } catch (error) {
            console.error(error);
            alert('Failed to create stock entry');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '100%', paddingBottom: '6rem' }}>
            <h1 className="page-title">New Stock Entry</h1>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Header Section */}
                <div className="card">
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        <div className="form-group">
                            <label className="form-label">Select Party</label>
                            <select {...register("party_id", { required: true })} className="form-select" style={{ height: '45px' }}>
                                <option value="">-- Choose Supplier --</option>
                                {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bill Date</label>
                            <input type="date" {...register("bill_date", { required: true })} className="form-input" style={{ height: '45px' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Invoice No</label>
                            <input className="form-input" defaultValue="Auto-Generated" disabled style={{ background: '#F1F5F9', color: '#94A3B8', height: '45px' }} />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="card" style={{ padding: '0', overflow: 'visible' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Products</h3>
                        <button type="button" onClick={() => append({ product_id: "", product_name: "", qty: 1, unit_price: 0, total: 0 })} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                            <FiPlus /> Add Row
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 1rem' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ textAlign: 'left', paddingBottom: '0.5rem', width: '40%' }}>Product</th>
                                    <th style={{ textAlign: 'left', paddingBottom: '0.5rem', width: '15%' }}>Quantity</th>
                                    <th style={{ textAlign: 'left', paddingBottom: '0.5rem', width: '20%' }}>Unit Price</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '0.5rem', width: '20%' }}>Total</th>
                                    <th style={{ width: '5%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field, index) => (
                                    <tr key={field.id} style={{ verticalAlign: 'top' }}>
                                        <td style={{ position: 'relative', paddingRight: '1rem' }}>
                                            {/* Product Search Widget */}
                                            <div onClick={() => setActiveRow(index)}>
                                                <input
                                                    {...register(`items.${index}.product_name` as const, { required: true })}
                                                    className="form-input"
                                                    placeholder="Search Product..."
                                                    autoComplete="off"
                                                    readOnly={activeRow !== index && !!items[index]?.product_id}
                                                    onClick={() => setActiveRow(index)}
                                                    onChange={(e) => {
                                                        if (activeRow === index) setSearchTerm(e.target.value);
                                                    }}
                                                    style={{ height: '45px' }}
                                                />
                                            </div>

                                            {/* Dropdown Results */}
                                            {activeRow === index && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50px',
                                                    left: 0,
                                                    width: '100%',
                                                    maxHeight: '300px',
                                                    overflowY: 'auto',
                                                    background: 'white',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                                    zIndex: 50
                                                }}>
                                                    <div style={{ padding: '0.5rem', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                                                        <input
                                                            autoFocus
                                                            placeholder="Type to filter..."
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: '4px',
                                                                fontSize: '0.85rem'
                                                            }}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                    {filteredProducts.map(p => (
                                                        <div
                                                            key={p._id}
                                                            onClick={() => selectProduct(index, p)}
                                                            style={{
                                                                padding: '0.75rem 1rem',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #F1F5F9',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>{p.title}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                    {p.brand?.name} • Category: {p.category?.name}
                                                                </div>
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, background: '#EFF6FF', color: '#3B82F6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                                Stock: {p.opening_stock}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {filteredProducts.length === 0 && (
                                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                            No products found.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {/* Overlay to close dropdown */}
                                            {activeRow === index && (
                                                <div
                                                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                                                    onClick={() => { setActiveRow(null); setSearchTerm(''); }}
                                                />
                                            )}
                                        </td>
                                        <td style={{ paddingRight: '1rem' }}>
                                            <input
                                                type="number"
                                                {...register(`items.${index}.qty` as const, { required: true, min: 1 })}
                                                className="form-input"
                                                style={{ height: '45px' }}
                                            />
                                        </td>
                                        <td style={{ paddingRight: '1rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>₹</span>
                                                <input
                                                    type="number"
                                                    {...register(`items.${index}.unit_price` as const, { required: true })}
                                                    className="form-input"
                                                    style={{ paddingLeft: '2rem', height: '45px' }}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', paddingTop: '12px', color: 'var(--text-main)' }}>
                                            ₹{(items[index]?.qty || 0) * (items[index]?.unit_price || 0)}
                                        </td>
                                        <td style={{ textAlign: 'center', paddingTop: '8px' }}>
                                            <button type="button" onClick={() => remove(index)} className="btn-icon" style={{ color: 'var(--danger)', background: '#FEF2F2' }}>
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <div className="card" style={{ width: '400px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sub Total</label>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{totalAmount}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>CGST</label>
                            <div style={{ width: '120px' }}>
                                <input type="number" {...register("cgst")} className="form-input" placeholder="0" style={{ textAlign: 'right' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>SGST</label>
                            <div style={{ width: '120px' }}>
                                <input type="number" {...register("sgst")} className="form-input" placeholder="0" style={{ textAlign: 'right' }} />
                            </div>
                        </div>

                        <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>Final Bill Amount</label>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>₹{finalBill}</div>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '1rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', zIndex: 100, gap: '1rem' }}>
                    <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 3rem', fontSize: '1rem' }}>
                        <FiSave style={{ marginRight: '0.5rem' }} /> Save Stock Entry
                    </button>
                </div>

            </form>
        </div>
    );
}
