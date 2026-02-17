"use client";

import { useForm, useWatch, useFieldArray, SubmitHandler, Controller } from "react-hook-form";
import RichTextEditor from "../../components/RichTextEditor";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { FiSave, FiUploadCloud, FiX, FiArrowLeft, FiPlus, FiTrash2, FiBox, FiImage, FiCheckCircle, FiEdit2, FiChevronDown } from "react-icons/fi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FormModal from "../../components/FormModal";
import Modal from "../../components/Modal";
import { useModal } from "../../hooks/useModal";
import BilingualInput from "../../../components/forms/BilingualInput";
import LanguageToggle from "../../../components/LanguageToggle";
import { useLanguage } from "../../../context/LanguageContext";

// --- Specifications Component ---
function SpecificationManager({ control, register, errors }: any) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "specifications"
    });

    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Specifications</span>
                <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => append({ key: { en: '', hi: '' }, value: { en: '', hi: '' } })}
                >
                    + Add Spec
                </button>
            </div>
            {fields.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: '8px' }}>
                    No specifications added. Add technical details like &quot;Material&quot;, &quot;Dimensions&quot;, etc.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {fields.map((field, index) => (
                        <div key={field.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ flex: 1 }}>
                                <BilingualInput
                                    label="Specification Name (Key)"
                                    registerEn={register(`specifications.${index}.key.en` as any, { required: "Required" })}
                                    registerHi={register(`specifications.${index}.key.hi` as any)}
                                    placeholderEn="e.g. Material"
                                    placeholderHi="उदा. सामग्री"
                                    errorEn={errors.specifications?.[index]?.key?.en}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <BilingualInput
                                    label="Specification Value"
                                    registerEn={register(`specifications.${index}.value.en` as any, { required: "Required" })}
                                    registerHi={register(`specifications.${index}.value.hi` as any)}
                                    placeholderEn="e.g. Stainless Steel"
                                    placeholderHi="उदा. स्टेनलेस स्टील"
                                    errorEn={errors.specifications?.[index]?.value?.en}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                style={{ marginTop: '1.8rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                <FiTrash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Nested Model Component ---
function ModelVariationManager({ modelIndex, control, register, errors, watch, VARIATION_SUGGESTIONS }: any) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `models.${modelIndex}.variations`
    });

    return (
        <div style={{ marginTop: '1rem', background: '#F1F5F9', borderRadius: '8px', padding: '1rem', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Model Variants</h5>
                <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    onClick={() => append({ type: 'Color', value: { en: '', hi: '' } as any, price: 0, mrp: 0, stock: 0, isActive: true })}
                >
                    + Add Selection
                </button>
            </div>

            {fields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '0.5rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                    No variants added for this model.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ color: '#64748B' }}>
                                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Image</th>
                                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Type</th>
                                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Value</th>
                                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Base MRP</th>
                                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Price</th>
                                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Stock</th>
                                <th style={{ padding: '0.4rem', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.map((field, index) => (
                                <tr key={field.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.4rem' }}>
                                        {/* Simplified Image Upload for nested variation */}
                                        <div style={{ position: 'relative', width: '36px', height: '36px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                                            {watch(`models.${modelIndex}.variations.${index}.image`) ? (
                                                <Image src={watch(`models.${modelIndex}.variations.${index}.image`)?.startsWith('http') ? watch(`models.${modelIndex}.variations.${index}.image`) : `http://localhost:5000/${watch(`models.${modelIndex}.variations.${index}.image`)}`} alt="Img" fill style={{ objectFit: 'cover' }} />
                                            ) : (
                                                <FiImage style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#cbd5e1' }} />
                                            )}
                                            <input type="file" {...register(`models.${modelIndex}.variations.${index}.imageFile`)} accept="image/*" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.4rem' }}>
                                        <select {...register(`models.${modelIndex}.variations.${index}.type`)} style={{ width: '80px', padding: '0.2rem', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
                                            <option value="Color">Color</option>
                                            <option value="Size">Size</option>
                                            <option value="Weight">Weight</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '0.4rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <input {...register(`models.${modelIndex}.variations.${index}.value.en`)} placeholder="Standard (En)" list={`model-${modelIndex}-suggestions-${index}`} style={{ padding: '0.2rem', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '4px' }} />
                                            <input {...register(`models.${modelIndex}.variations.${index}.value.hi`)} placeholder="मानक (Hi)" list={`model-${modelIndex}-suggestions-hi-${index}`} style={{ padding: '0.2rem', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '4px' }} />
                                            <datalist id={`model-${modelIndex}-suggestions-${index}`}>
                                                {VARIATION_SUGGESTIONS[watch(`models.${modelIndex}.variations.${index}.type`)]?.map((opt: string) => (
                                                    <option key={opt} value={opt} />
                                                ))}
                                            </datalist>
                                            <datalist id={`model-${modelIndex}-suggestions-hi-${index}`}>
                                                {VARIATION_SUGGESTIONS[watch(`models.${modelIndex}.variations.${index}.type`)]?.map((opt: string) => (
                                                    <option key={opt} value={opt} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.4rem' }}><input type="number" {...register(`models.${modelIndex}.variations.${index}.mrp`)} placeholder="MRP" style={{ width: '60px', padding: '0.2rem', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '4px' }} /></td>
                                    <td style={{ padding: '0.4rem' }}><input type="number" {...register(`models.${modelIndex}.variations.${index}.price`)} placeholder="Price" style={{ width: '60px', padding: '0.2rem', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '4px' }} /></td>
                                    <td style={{ padding: '0.4rem' }}><input type="number" {...register(`models.${modelIndex}.variations.${index}.stock`)} placeholder="Qty" style={{ width: '50px', padding: '0.2rem', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '4px' }} /></td>
                                    <td style={{ padding: '0.4rem' }}><input {...register(`models.${modelIndex}.variations.${index}.sku`)} placeholder="SKU" style={{ width: '80px', padding: '0.2rem', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '4px' }} /></td>
                                    <td style={{ padding: '0.4rem', textAlign: 'center' }}><input type="checkbox" {...register(`models.${modelIndex}.variations.${index}.isActive`)} /></td>
                                    <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                                        <button type="button" onClick={() => remove(index)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer' }}><FiX /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// --- Schema ---
const productSchema = z.object({
    title: z.union([
        z.string().min(3, "Title is required"),
        z.object({
            en: z.string().min(3, "English title is required"),
            hi: z.string().optional()
        })
    ]),
    slug: z.string().min(3, "Slug is required"),
    subtitle: z.union([
        z.string(),
        z.object({
            en: z.string().optional(),
            hi: z.string().optional()
        })
    ]).optional(),
    part_number: z.string().optional(),

    category: z.string().min(1, "Category is required"),
    sub_category: z.string().optional(),
    brand: z.string().optional(),
    offers: z.array(z.string()).optional(),

    hsn_code: z.string().optional(),
    gst_rate: z.coerce.number().optional(),
    mrp: z.coerce.number().min(0, "MRP is required"),
    selling_price_a: z.coerce.number().optional(),
    selling_price_b: z.coerce.number().optional(),
    selling_price_c: z.coerce.number().optional(),
    delivery_charge: z.coerce.number().default(0),

    opening_stock: z.coerce.number().default(0),
    low_stock_threshold: z.coerce.number().default(5),
    max_unit_buy: z.coerce.number().optional(),

    description: z.union([
        z.string(),
        z.object({
            en: z.string().optional(),
            hi: z.string().optional()
        })
    ]).optional(),

    color_name: z.string().optional(),
    color_hex: z.string().optional(),
    size: z.string().optional(),

    meta_title: z.union([
        z.string(),
        z.object({
            en: z.string().optional(),
            hi: z.string().optional()
        })
    ]).optional(),
    meta_description: z.union([
        z.string(),
        z.object({
            en: z.string().optional(),
            hi: z.string().optional()
        })
    ]).optional(),

    isFeatured: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isTopSale: z.boolean().default(false),
    isDailyOffer: z.boolean().default(false),
    isVisible: z.boolean().default(true),
    isOnDemand: z.boolean().default(false),
    isCancellable: z.boolean().default(true),
    isReturnable: z.boolean().default(true),
    deliveryTime: z.union([
        z.string(),
        z.object({
            en: z.string().optional(),
            hi: z.string().optional()
        })
    ]).optional(),
    returnWindow: z.coerce.number().default(7),

    // Variations
    variations: z.array(z.object({
        type: z.string(),
        value: z.union([
            z.string(),
            z.object({
                en: z.string().optional(),
                hi: z.string().optional()
            })
        ]),
        price: z.coerce.number(),
        mrp: z.coerce.number().optional(),
        stock: z.coerce.number(),
        sku: z.string().optional(),
        image: z.string().optional(),
        isActive: z.boolean().default(true),
        // helper for file upload
        imageFile: z.any().optional(),
        _id: z.string().optional()
    }).refine((data) => !data.mrp || Number(data.mrp) > Number(data.price), {
        message: "MRP > Price",
        path: ["price"]
    })).optional(),
    // Models
    models: z.array(z.object({
        _id: z.string().optional(),
        name: z.union([
            z.string().min(1, "Model name is required"),
            z.object({
                en: z.string().min(1, "English model name is required"),
                hi: z.string().optional()
            })
        ]),
        mrp: z.coerce.number().optional(),
        selling_price_a: z.coerce.number().optional(),
        isActive: z.boolean().default(true),
        featured_image: z.string().optional(),
        imageFile: z.any().optional(),
        variations: z.array(z.object({
            _id: z.string().optional(),
            type: z.string(),
            value: z.union([
                z.string().min(1, "Value is required"),
                z.object({
                    en: z.string().min(1, "English value is required"),
                    hi: z.string().optional()
                })
            ]),
            price: z.coerce.number(),
            mrp: z.coerce.number().optional(),
            stock: z.coerce.number(),
            sku: z.string().optional(),
            isActive: z.boolean().default(true),
            image: z.string().optional(),
            imageFile: z.any().optional()
        }).refine((data) => !data.mrp || Number(data.mrp) > Number(data.price), {
            message: "MRP > Price",
            path: ["price"]
        })).optional()
    })).optional()
});

type ProductFormData = z.infer<typeof productSchema>;

const VARIATION_SUGGESTIONS: Record<string, string[]> = {
    Color: ['Red', 'Blue', 'Green', 'Black', 'White', 'Silver', 'Gold', 'Grey', 'Yellow', 'Orange', 'Brown', 'Ivory', 'Beige'],
    Size: ['Small', 'Medium', 'Large', 'Extra Large', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
    Weight: ['100g', '250g', '500g', '1kg', '2kg', '5kg', '10kg', '20kg', '50kg'],
    Volume: ['100ml', '250ml', '500ml', '1L', '2L', '5L', '10L', '20L', '50L'],
    Pack: ['Pack of 1', 'Pack of 2', 'Pack of 5', 'Pack of 10', 'Set of 4', 'Box of 10', 'Box of 100'],
    Battery: ['3kWh', '4kWh', '5kWH', '6kWh'],
    Range: ['100km', '150km', '200km', '250km'],
    Storage: ['128GB', '256GB', '512GB', '1TB'],
    Other: []
};

interface ProductFormProps {
    productId?: string;
}

interface ProductImage {
    id: string; // temp id
    url?: string; // existing url
    file?: File; // new upload
    altText: string;
    isMain: boolean;
}

export default function ProductForm({ productId }: ProductFormProps) {
    const router = useRouter();
    const { modalState, showModal, hideModal, showSuccess, showError } = useModal();
    const { language } = useLanguage();

    // Applied Offers Dropdown State
    const [isOfferDropdownOpen, setIsOfferDropdownOpen] = useState(false);
    const offerDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (offerDropdownRef.current && !offerDropdownRef.current.contains(event.target as Node)) {
                setIsOfferDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // New Image System State
    const [productImages, setProductImages] = useState<ProductImage[]>([]);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [hsns, setHsns] = useState<any[]>([]);

    const [featuredImage, setFeaturedImage] = useState<File | null>(null);
    const [featuredImage2, setFeaturedImage2] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);

    // Image Input Methods
    const [featuredMethod, setFeaturedMethod] = useState<'upload' | 'link'>('upload');
    const [featuredLink, setFeaturedLink] = useState('');

    const [featuredMethod2, setFeaturedMethod2] = useState<'upload' | 'link'>('upload');
    const [featuredLink2, setFeaturedLink2] = useState('');

    // Preview states for edit mode
    const [previewFeatured, setPreviewFeatured] = useState<string | null>(null);
    const [previewFeatured2, setPreviewFeatured2] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [variationMode, setVariationMode] = useState<'standard' | 'standalone' | 'models'>('standard');
    const [imageError, setImageError] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        setError,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            gst_rate: 18,
            delivery_charge: 0,
            opening_stock: 0,
            low_stock_threshold: 5,
            isCancellable: true,
            isReturnable: true,
            deliveryTime: '3-5 business days',
            returnWindow: 7,
            keywords: { en: '', hi: '' }
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "variations"
    });

    const { fields: modelFields, append: appendModel, remove: removeModel } = useFieldArray({
        control,
        name: "models"
    });

    // Watchers for Calculations
    const mrp = useWatch({ control, name: "mrp" });
    const sellingPrice = useWatch({ control, name: "selling_price_a" });
    const variations = useWatch({ control, name: "variations" });
    const models = useWatch({ control, name: "models" });
    const selectedCategory = useWatch({ control, name: "category" });
    const productTitle = useWatch({ control, name: "title" });

    // Auto Generate Slug (Only in Create Mode)
    useEffect(() => {
        if (!productId && productTitle) {
            const titleStr = typeof productTitle === 'string' ? productTitle : productTitle?.en;
            if (titleStr) {
                const slug = titleStr.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
                setValue("slug", slug);
            }
        }
    }, [productTitle, setValue, productId]);

    // Fetch Masters & Product Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, brandRes, offerRes, hsnRes] = await Promise.all([
                    api.get('/admin/categories'),
                    api.get('/admin/brands'),
                    api.get('/admin/offers'),
                    api.get('/admin/hsn')
                ]);
                setCategories(catRes.data);
                setBrands(brandRes.data);
                setOffers(offerRes.data);
                setHsns(hsnRes.data);

                // If Editing, Fetch Product
                if (productId) {
                    const prodRes = await api.get(`/admin/products/${productId}`);
                    const product = prodRes.data;

                    // Pre-fetch subcategories for the product's category to ensure dropdown is populated
                    const categoryId = product.category?._id || product.category;
                    if (categoryId) {
                        try {
                            const subCatRes = await api.get(`/admin/sub-categories?category_id=${categoryId}`);
                            setSubCategories(subCatRes.data);
                        } catch (subErr) {
                            console.error("Failed to pre-fetch subcategories", subErr);
                        }
                    }

                    // Populate Form
                    reset({
                        title: (typeof product.title === 'string' ? { en: product.title, hi: '' } : product.title),
                        slug: product.slug,
                        subtitle: typeof product.subtitle === 'string' ? { en: product.subtitle, hi: '' } : product.subtitle,
                        part_number: product.part_number,
                        category: categoryId,
                        sub_category: Array.isArray(product.sub_category) ? (product.sub_category[0]?._id || product.sub_category[0]) : (product.sub_category?._id || product.sub_category),
                        brand: product.brand?._id || product.brand,
                        offers: Array.isArray(product.offers) ? product.offers.map((o: any) => o._id || o) : (product.offer ? [product.offer?._id || product.offer] : []),
                        hsn_code: product.hsn_code?._id || product.hsn_code,
                        gst_rate: product.gst_rate,
                        mrp: product.mrp,
                        selling_price_a: product.selling_price_a,
                        selling_price_b: product.selling_price_b,
                        selling_price_c: product.selling_price_c,
                        delivery_charge: product.delivery_charge,
                        opening_stock: product.opening_stock,
                        low_stock_threshold: product.low_stock_threshold,
                        max_unit_buy: product.max_unit_buy,
                        description: typeof product.description === 'string' ? { en: product.description, hi: '' } : product.description,
                        color_name: product.color_name,
                        color_hex: product.color_hex,
                        size: product.size,
                        meta_title: (typeof product.meta_title === 'string' ? { en: product.meta_title, hi: '' } : product.meta_title),
                        meta_description: (typeof product.meta_description === 'string' ? { en: product.meta_description, hi: '' } : product.meta_description),
                        keywords: {
                            en: Array.isArray(product.keywords) ? product.keywords.join(', ') : (product.keywords?.en ? product.keywords.en.join(', ') : ''),
                            hi: product.keywords?.hi ? product.keywords.hi.join(', ') : ''
                        },
                        isFeatured: product.isFeatured || false,
                        isNewArrival: product.isNewArrival || false,
                        isTopSale: product.isTopSale || false,
                        isDailyOffer: product.isDailyOffer || false,
                        isVisible: product.isVisible !== false, // Default true if undefined
                        isOnDemand: product.isOnDemand || false,
                        isCancellable: product.isCancellable !== false,
                        isReturnable: product.isReturnable !== false,
                        deliveryTime: typeof product.deliveryTime === 'string' ? { en: product.deliveryTime, hi: '' } : (product.deliveryTime || { en: '3-5 business days', hi: '' }),
                        returnWindow: product.returnWindow || 7,
                        variations: (product.variations || []).map((v: any) => ({
                            ...v,
                            value: typeof v.value === 'string' ? { en: v.value, hi: '' } : v.value
                        })),
                        models: (product.models || []).map((m: any) => ({
                            ...m,
                            name: typeof m.name === 'string' ? { en: m.name, hi: '' } : m.name,
                            variations: (m.variations || []).map((mv: any) => ({
                                ...mv,
                                value: typeof mv.value === 'string' ? { en: mv.value, hi: '' } : mv.value
                            }))
                        })),
                        specifications: Array.isArray(product.specifications) ? product.specifications.map((s: any) => ({
                            key: typeof s.key === 'string' ? { en: s.key, hi: '' } : s.key,
                            value: typeof s.value === 'string' ? { en: s.value, hi: '' } : s.value
                        })) : []
                    });

                    // Set Variation Mode
                    if (product.models && product.models.length > 0) {
                        setVariationMode('models');
                    } else if (product.variations && product.variations.length > 0) {
                        setVariationMode('standalone');
                    } else {
                        setVariationMode('standard');
                    }

                    // Populate Images (New System + Legacy Fallback)
                    let initialImages: ProductImage[] = [];
                    if (product.images && product.images.length > 0) {
                        initialImages = product.images.map((img: any, idx: number) => ({
                            id: `existing-${idx}`,
                            url: img.url.startsWith('http') ? img.url : `http://localhost:5000/${img.url}`,
                            altText: img.altText || '',
                            isMain: img.isMain || false
                        }));
                    } else {
                        // Legacy Fallback
                        if (product.featured_image) {
                            initialImages.push({
                                id: 'legacy-main',
                                url: product.featured_image.startsWith('http') ? product.featured_image : `http://localhost:5000/${product.featured_image}`,
                                altText: '',
                                isMain: true
                            });
                        }
                        if (product.featured_image_2) {
                            initialImages.push({
                                id: 'legacy-hover',
                                url: product.featured_image_2.startsWith('http') ? product.featured_image_2 : `http://localhost:5000/${product.featured_image_2}`,
                                altText: '',
                                isMain: false
                            });
                        }
                        if (product.gallery_images && Array.isArray(product.gallery_images)) {
                            product.gallery_images.forEach((url: string, idx: number) => {
                                // Check for duplicates with main
                                if (url !== product.featured_image && url !== product.featured_image_2) {
                                    initialImages.push({
                                        id: `legacy-gall-${idx}`,
                                        url: url.startsWith('http') ? url : `http://localhost:5000/${url}`,
                                        altText: '',
                                        isMain: false
                                    });
                                }
                            });
                        }
                    }
                    setProductImages(initialImages);

                    // Keep legacy preview states for now just in case (though we won't use them in UI)
                    if (product.featured_image) {
                        setPreviewFeatured(product.featured_image.startsWith('http') ? product.featured_image : `http://localhost:5000/${product.featured_image}`);
                    }
                }

            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, [productId, reset]);

    // Filter SubCategories
    useEffect(() => {
        if (selectedCategory) {
            api.get(`/admin/sub-categories?category_id=${selectedCategory}`)
                .then(res => setSubCategories(res.data))
                .catch(console.error);
        } else {
            setSubCategories([]);
        }
    }, [selectedCategory]);

    // Image Handler Functions
    const handleAddImageSlot = () => {
        if (productImages.length >= 5) {
            showError("Maximum 5 main images allowed.");
            return;
        }
        setProductImages([...productImages, { id: `new-${Date.now()}`, altText: '', isMain: productImages.length === 0 }]);
    };

    const handleRemoveImageSlot = (index: number) => {
        const newImages = [...productImages];
        newImages.splice(index, 1);
        // Ensure one main image exists if list not empty
        if (newImages.length > 0 && !newImages.some(img => img.isMain)) {
            newImages[0].isMain = true;
        }
        setProductImages(newImages);
    };

    const handleImageChange = (index: number, field: keyof ProductImage, value: any) => {
        const newImages = [...productImages];
        // @ts-ignore
        newImages[index] = { ...newImages[index], [field]: value };

        if (field === 'isMain' && value === true) {
            // Unset others
            newImages.forEach((img, i) => {
                if (i !== index) img.isMain = false;
            });
        }
        setProductImages(newImages);
    };

    const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
        setLoading(true);
        setImageError(false);

        // --- Custom Image Validation ---
        const hasMain = productImages.some(img => img.isMain);
        if (productImages.length === 0) {
            showError("At least one Product Image is required!");
            setImageError(true);
            document.getElementById('media-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setLoading(false);
            return;
        }
        if (!hasMain) {
            showError("Please select one image as Main Image.");
            setLoading(false);
            return;
        }

        let hasImageError = false;

        if (variationMode === 'models') {
            if (data.models) {
                data.models.forEach((m: any, mIdx: number) => {
                    // Check Model Image
                    const hasModelImage = (m.imageFile && m.imageFile.length > 0) || m.featured_image;
                    if (!hasModelImage) {
                        setError(`models.${mIdx}.imageFile`, { type: 'manual', message: 'Required' });
                        hasImageError = true;
                    }

                    // Check Model Variation Images
                    if (m.variations) {
                        m.variations.forEach((v: any, vIdx: number) => {
                            // Note: Accessing data from the form data object passed by RHF. 
                            // Verify if data.models[mIdx].variations[vIdx].imageFile follows the structure.
                            const vFile = data.models[mIdx]?.variations?.[vIdx]?.imageFile;
                            const hasVarImage = (vFile && vFile.length > 0) || v.image;
                            if (!hasVarImage) {
                                setError(`models.${mIdx}.variations.${vIdx}.imageFile`, { type: 'manual', message: 'Required' });
                                hasImageError = true;
                            }
                        });
                    }
                });
            }
        } else if (variationMode === 'standalone') {
            if (data.variations) {
                data.variations.forEach((v: any, vIdx: number) => {
                    const vFile = data.variations[vIdx]?.imageFile;
                    const hasVarImage = (vFile && vFile.length > 0) || v.image;
                    if (!hasVarImage) {
                        setError(`variations.${vIdx}.imageFile`, { type: 'manual', message: 'Required' });
                        hasImageError = true;
                    }
                });
            }
        }

        if (hasImageError) {
            showError("Please upload images for all models and variations (marked in red or in the Image Manager).");
            setImageError(true);
            setLoading(false);
            return;
        }
        // -------------------------------

        try {
            const formData = new FormData();

            // Only append non-empty values to avoid validation errors
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'variations' || key === 'models') return; // Handle manually

                // For variation modes, we override mrp, selling_price_a, and opening_stock later
                if (variationMode !== 'standard' && (key === 'mrp' || key === 'selling_price_a' || key === 'opening_stock')) return;

                if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
                    // Fix: Handle arrays (like sub_category if it's multiple, or keywords)
                    if (Array.isArray(value)) {
                        formData.append(key, (value as any[]).filter(v => v !== '').join(','));
                    }
                    // Fix casting for instanceof check
                    else if (typeof value === 'object' && !(value as any instanceof File)) {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, value.toString());
                    }
                }
            });

            // For Standalone/Models, we use the derived prices and stock for the "Main" product fields
            if (variationMode !== 'standard') {
                formData.set('mrp', effectiveMRP.toString());
                formData.set('selling_price_a', effectiveSellingPrice.toString());
                formData.set('opening_stock', effectiveOpeningStock.toString());
                formData.set('stock', effectiveOpeningStock.toString());
            } else if (!data.mrp) {
                // Manual validation for standard mode since Zod is now optional for flexibility
                setLoading(false);
                setError("mrp", { type: "manual", message: "MRP is required" });
                showError("Please fill in all required fields: MRP");

                const element = document.getElementsByName("mrp")[0] || document.querySelector('[name="mrp"]');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    (element as any).focus?.();
                }
                return;
            } else {
                // For standard mode, just ensure stock matches opening_stock
                formData.set('stock', (data.opening_stock || 0).toString());
            }

            // Handle Variations (Only if mode is standalone)
            const cleanedVariations: any[] = [];
            if (variationMode === 'standalone') {
                if (data.variations) {
                    data.variations.forEach((v: any, index: number) => {
                        const clone = { ...v };
                        if (!clone._id) delete clone._id;
                        // Remote empty SKU strings to avoid unique index "duplicate key" error on empty strings
                        if (!clone.sku || clone.sku.trim() === "") {
                            delete clone.sku;
                        }

                        const vFile = data.variations[index].imageFile;
                        if (vFile?.[0]) {
                            formData.append(`variation_image_${index}`, vFile[0]);
                        }
                        delete clone.imageFile; // Remove file list from JSON
                        cleanedVariations.push(clone);
                    });
                }
                formData.append('variations', JSON.stringify(cleanedVariations));
            } else {
                formData.append('variations', JSON.stringify([]));
            }

            // Handle Models (Only if mode is models)
            const cleanedModels: any[] = [];
            if (variationMode === 'models') {
                if (data.models) {
                    data.models.forEach((m: any, mIdx: number) => {
                        const mClone = { ...m };
                        const mFile = data.models[mIdx].imageFile;
                        if (mFile?.[0]) {
                            formData.append(`model_image_${mIdx}`, mFile[0]);
                        }
                        delete mClone.imageFile; // Remove from JSON

                        if (m.variations) {
                            const mVarCleaned: any[] = [];
                            m.variations.forEach((v: any, vIdx: number) => {
                                const vClone = { ...v };
                                // Remote empty SKU strings to avoid unique index "duplicate key" error on empty strings
                                if (!vClone.sku || vClone.sku.trim() === "") {
                                    delete vClone.sku;
                                }

                                const mvFile = data.models[mIdx].variations[vIdx].imageFile;
                                if (mvFile?.[0]) {
                                    formData.append(`model_${mIdx}_variation_image_${vIdx}`, mvFile[0]);
                                }
                                delete vClone.imageFile; // Remove from JSON
                                mVarCleaned.push(vClone);
                            });
                            mClone.variations = mVarCleaned;
                        }
                        cleanedModels.push(mClone);
                    });
                }
                formData.append('models', JSON.stringify(cleanedModels));
            } else {
                formData.append('models', JSON.stringify([]));
            }

            // Handle featured image
            // Handle Product Images (New Modal System)
            const imagesMeta = productImages.map((img, idx) => {
                // Destructure to remove file/id from JSON
                const { file, id, ...rest } = img;
                if (file) {
                    formData.append(`product_image_${idx}`, file);
                }
                return rest;
            });
            formData.append('images', JSON.stringify(imagesMeta));

            // Legacy Fallback (Optional: strictly speaking not needed if backend handles images array, 
            // but we might want to ensure 'featured_image' is set if logic fails. 
            // However, backend pre-save hook handles logic. So we can rely on `images`.
            // We do NOT send legacy fields to avoid overriding backend sync logic.

            if (productId) {
                await api.put(`/admin/products/${productId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Product Updated Successfully!');
            } else {
                await api.post('/admin/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccess('Product Created Successfully!');
            }
            router.push('/admin/products');
        } catch (err: any) {
            console.error(err);
            console.error("Product Save Error Details:", JSON.stringify(err.response?.data || {}, null, 2)); // Log full error for debugging

            let msg = err.response?.data?.message || err.message;
            const backendError = err.response?.data?.error;

            if (typeof backendError === 'string' && backendError.includes('E11000')) {
                if (backendError.includes('slug')) {
                    msg = "A product with this name/slug already exists. Please change the title or the slug.";
                    setError("slug", { type: "manual", message: "Slug already exists" });
                } else {
                    msg = `Duplicate Entry Error: ${backendError}`;
                }
            } else if (err.response?.data?.errors) {
                const details = err.response.data.errors.map((e: any) => `${e.path || e.param || 'field'}: ${e.msg}`).join(', ');
                msg += ": " + details;
            } else if (err.response?.data?.detail) {
                msg += ": " + err.response.data.detail;
            }

            showError('Error saving product: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    // Variation Calculations for Pricing Section
    const variationPrices = variations?.filter((v: any) => v.isActive).map((v: any) => Number(v.price)).filter((p: number) => !isNaN(p) && p > 0) || [];
    const minVarPrice = variationPrices.length > 0 ? Math.min(...variationPrices) : null;

    const variationMRPs = variations?.filter((v: any) => v.isActive).map((v: any) => Number(v.mrp)).filter((m: number) => !isNaN(m) && m > 0) || [];
    const minVarMRP = variationMRPs.length > 0 ? Math.min(...variationMRPs) : null;

    // Calculate details from models
    const modelPrices = models?.flatMap((m: any) =>
        m.variations?.filter((v: any) => v.isActive !== false).map((v: any) => Number(v.price))
    ).filter((p: number) => !isNaN(p) && p > 0) || [];
    const minModelPrice = modelPrices.length > 0 ? Math.min(...modelPrices) : null;

    const modelMRPs = models?.flatMap((m: any) =>
        m.variations?.filter((v: any) => v.isActive !== false).map((v: any) => Number(v.mrp))
    ).filter((m: number) => !isNaN(m) && m > 0) || [];
    const minModelMRP = modelMRPs.length > 0 ? Math.min(...modelMRPs) : null;

    const effectiveMRP = mrp || minVarMRP || minModelMRP || 0;
    const effectiveSellingPrice = sellingPrice || minVarPrice || minModelPrice || 0;

    const youSave = effectiveMRP - effectiveSellingPrice;
    const youSavePercent = effectiveMRP ? Math.round((youSave / effectiveMRP) * 100) : 0;

    const totalVariationStock = variations?.filter((v: any) => v.isActive).reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0) || 0;
    const totalModelStock = models?.reduce((acc: number, m: any) => {
        const mStock = m.variations?.filter((v: any) => v.isActive !== false).reduce((vAcc: number, v: any) => vAcc + (Number(v.stock) || 0), 0) || 0;
        return acc + mStock;
    }, 0) || 0;

    const openingStock = watch("opening_stock");
    const effectiveOpeningStock = variationMode === 'standard' ? (Number(openingStock) || 0) : (variationMode === 'models' ? totalModelStock : totalVariationStock);

    return (
        <div className="container" style={{ maxWidth: '1400px' }}>
            {/* Actions Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => router.back()} className="btn btn-secondary">
                    <FiArrowLeft /> Back to List
                </button>
                <button
                    onClick={handleSubmit(onSubmit, (errors) => {
                        console.error("Form Validation Errors:", errors);

                        const getErrorPaths = (obj: any, prefix = ''): string[] => {
                            return Object.keys(obj).reduce((acc: string[], key: string) => {
                                const path = prefix ? `${prefix}.${key}` : key;
                                // @ts-ignore
                                if (obj[key]?.message) {
                                    acc.push(path);
                                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                                    acc.push(...getErrorPaths(obj[key], path));
                                }
                                return acc;
                            }, []);
                        };

                        const errorPaths = getErrorPaths(errors);
                        const labels: Record<string, string> = {
                            title: 'Product Title',
                            slug: 'Slug',
                            category: 'Category',
                            mrp: 'MRP',
                            selling_price_a: 'Selling Price',
                        };

                        const missing = errorPaths.map(path => {
                            if (labels[path]) return labels[path];
                            if (path.includes('models')) {
                                const match = path.match(/models\.(\d+)\.name/);
                                if (match) return `Model Name (Model ${parseInt(match[1]) + 1})`;
                                const vMatch = path.match(/models\.(\d+)\.variations\.(\d+)\.(value|price)/);
                                if (vMatch) return `Model Variation ${vMatch[3]} (Model ${parseInt(vMatch[1]) + 1})`;
                            }
                            if (path.includes('variations')) {
                                const match = path.match(/variations\.(\d+)\.(value|price)/);
                                if (match) return `Variation ${match[2]} (Line ${parseInt(match[1]) + 1})`;
                            }
                            return path;
                        });

                        const uniqueMissing = Array.from(new Set(missing));
                        const msg = uniqueMissing.length > 0
                            ? `Please fill in all required fields: ${uniqueMissing.join(', ')}`
                            : "Please fill in all required fields marked in red.";

                        showError(msg);

                        if (errorPaths.length > 0) {
                            const firstPath = errorPaths[0];
                            const element = document.getElementsByName(firstPath)[0];
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                (element as any).focus?.();
                            } else {
                                const sel = document.querySelector(`[name="${firstPath}"]`);
                                if (sel) {
                                    sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }
                        }
                    })}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    <FiSave /> {loading ? 'Saving...' : 'Save Product'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                {/* Left Column (Main Info) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Basic Info Card */}
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Basic Details</span>
                            <LanguageToggle />
                        </div>
                        <div className="form-grid">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <BilingualInput
                                    label="Product Title *"
                                    registerEn={register("title.en", { required: "English title is required" })}
                                    registerHi={register("title.hi")}
                                    errorEn={errors.title && (errors.title as any).en}
                                    errorHi={errors.title && (errors.title as any).hi}
                                    placeholderEn="e.g. Heavy Duty Drill"
                                    placeholderHi="उदा. हैवी ड्यूटी ड्रिल"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Slug</label>
                                <input {...register("slug")} className="form-input" style={{ borderColor: errors.slug ? 'var(--danger)' : undefined }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Part Number</label>
                                <input {...register("part_number")} className="form-input" placeholder="MFG-001" />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <BilingualInput
                                    label="Subtitle"
                                    registerEn={register("subtitle.en")}
                                    registerHi={register("subtitle.hi")}
                                    errorEn={errors.subtitle && (errors.subtitle as any).en}
                                    errorHi={errors.subtitle && (errors.subtitle as any).hi}
                                    placeholderEn="Short description"
                                    placeholderHi="संक्षिप्त विवरण"
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="form-label">Description</label>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {language === 'en' ? 'English' : 'हिंदी'} Mode
                                    </div>
                                </div>
                                <div style={{ display: language === 'en' ? 'block' : 'none' }}>
                                    <Controller
                                        name="description.en"
                                        control={control}
                                        render={({ field }) => (
                                            <RichTextEditor
                                                value={field.value}
                                                onChange={(data) => field.onChange(data)}
                                                placeholder="Detailed product description in English..."
                                            />
                                        )}
                                    />
                                    {errors.description && (errors.description as any).en && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{(errors.description as any).en.message}</span>}
                                </div>
                                <div style={{ display: language === 'hi' ? 'block' : 'none' }}>
                                    <Controller
                                        name="description.hi"
                                        control={control}
                                        render={({ field }) => (
                                            <RichTextEditor
                                                value={field.value}
                                                onChange={(data) => field.onChange(data)}
                                                placeholder="हिंदी में विस्तृत उत्पाद विवरण..."
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variation Mode Selector (Slider) */}
                    {/* Inventory System (Merged) */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div className="card-header">Inventory System</div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.4rem', borderRadius: '12px', gap: '0.4rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setVariationMode('standard')}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                        transition: 'all 0.3s ease', fontWeight: 600,
                                        backgroundColor: variationMode === 'standard' ? '#fff' : 'transparent',
                                        color: variationMode === 'standard' ? 'var(--primary)' : '#64748B',
                                        boxShadow: variationMode === 'standard' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
                                    }}
                                >
                                    Standard (Single)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVariationMode('standalone')}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                        transition: 'all 0.3s ease', fontWeight: 600,
                                        backgroundColor: variationMode === 'standalone' ? '#fff' : 'transparent',
                                        color: variationMode === 'standalone' ? 'var(--primary)' : '#64748B',
                                        boxShadow: variationMode === 'standalone' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
                                    }}
                                >
                                    Standalone Variations
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVariationMode('models')}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                        transition: 'all 0.3s ease', fontWeight: 600,
                                        backgroundColor: variationMode === 'models' ? '#fff' : 'transparent',
                                        color: variationMode === 'models' ? 'var(--primary)' : '#64748B',
                                        boxShadow: variationMode === 'models' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
                                    }}
                                >
                                    Product Models
                                </button>
                            </div>
                            <p style={{ marginTop: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#64748B', textAlign: 'center' }}>
                                {variationMode === 'standard' && "Best for products with a fixed price and stock level."}
                                {variationMode === 'standalone' && "Best for single-model products with multiple sizes, colors, or packs."}
                                {variationMode === 'models' && "Best for complex products that have distinct sub-models (e.g. Pro, Max) with their own variants."}
                            </p>

                            {/* Separator if not standard */}
                            {variationMode !== 'standard' && <div style={{ height: '1px', backgroundColor: '#E2E8F0', marginBottom: '1.5rem' }}></div>}

                            {/* Standard Mode Info */}
                            {variationMode === 'standard' && (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontSize: '0.9rem', border: '1px dashed #E2E8F0', borderRadius: '8px' }}>
                                    Standard product mode selected. No variations needed.
                                </div>
                            )}

                            {/* Product Models Manager (Hierarchical) */}
                            {variationMode === 'models' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Product Models</h4>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => appendModel({ name: { en: '', hi: '' } as any, variations: [], isActive: true })}
                                        >
                                            + Add New Model
                                        </button>
                                    </div>
                                    <div>
                                        {modelFields.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                                                <p style={{ margin: 0 }}>Click &quot;+ Add New Model&quot; to start building your product structure.</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                {modelFields.map((field, mIdx) => (
                                                    <div key={field.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                                                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                                                            <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
                                                                <div style={{
                                                                    position: 'relative', width: '60px', height: '60px', borderRadius: '8px',
                                                                    border: errors.models?.[mIdx]?.imageFile ? '2px dashed var(--danger)' : '2px dashed #CBD5E1',
                                                                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}>
                                                                    {watch(`models.${mIdx}.imageFile`)?.[0] ? (
                                                                        <Image src={URL.createObjectURL(watch(`models.${mIdx}.imageFile`)[0])} alt="Preview" fill style={{ objectFit: 'cover' }} />
                                                                    ) : watch(`models.${mIdx}.featured_image`) ? (
                                                                        <Image src={watch(`models.${mIdx}.featured_image`)?.startsWith('http') ? watch(`models.${mIdx}.featured_image`) : `http://localhost:5000/${watch(`models.${mIdx}.featured_image`)}`} alt="Exist" fill style={{ objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <FiUploadCloud size={20} color="#94A3B8" />
                                                                    )}
                                                                    <input type="file" {...register(`models.${mIdx}.imageFile`)} accept="image/*" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                                                </div>
                                                                <div style={{ flex: 1, paddingRight: '1rem' }}>
                                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                                        <BilingualInput
                                                                            label="Model Name"
                                                                            registerEn={register(`models.${mIdx}.name.en` as any)}
                                                                            registerHi={register(`models.${mIdx}.name.hi` as any)}
                                                                            placeholderEn="e.g. Pro Edition"
                                                                            placeholderHi="उदा. प्रो एडिशन"
                                                                            required
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button type="button" onClick={() => removeModel(mIdx)} style={{ marginLeft: '1rem', color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}><FiTrash2 size={20} /></button>
                                                        </div>

                                                        <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
                                                            <ModelVariationManager modelIndex={mIdx} control={control} register={register} errors={errors} watch={watch} VARIATION_SUGGESTIONS={VARIATION_SUGGESTIONS} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Variations Manager (Standalone) */}
                            {variationMode === 'standalone' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Standalone Variations</h4>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => append({ type: 'Size', value: { en: '', hi: '' } as any, price: sellingPrice || 0, mrp: mrp || 0, stock: 0, isActive: true })}
                                        >
                                            + Add Selection
                                        </button>
                                    </div>
                                    <div>
                                        {fields.length === 0 ? (
                                            <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
                                                No variations added. Standard single price/stock will be used.
                                            </div>
                                        ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                    <thead style={{ background: '#f8fafc', color: 'var(--text-muted)' }}>
                                                        <tr>
                                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Image</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Type</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>MRP (₹)</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Price (₹)</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Stock</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>SKU</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Active</th>
                                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {fields.map((field, index) => {
                                                            const rowMrp = watch(`variations.${index}.mrp`);
                                                            const rowPrice = watch(`variations.${index}.price`);
                                                            const isInvalidPrice = Number(rowMrp) > 0 && Number(rowPrice) >= Number(rowMrp);

                                                            return (
                                                                <tr key={field.id} style={{ borderBottom: '1px solid #eee' }}>
                                                                    <td style={{ padding: '0.5rem', width: '80px' }}>
                                                                        {/* Image Preview & Input */}
                                                                        <div style={{
                                                                            position: 'relative', width: '50px', height: '50px',
                                                                            border: errors.variations?.[index]?.imageFile ? '1px solid var(--danger)' : '1px solid #ddd',
                                                                            borderRadius: '4px', overflow: 'hidden'
                                                                        }}>
                                                                            {watch(`variations.${index}.imageFile`)?.[0] ? (
                                                                                <Image
                                                                                    src={URL.createObjectURL(watch(`variations.${index}.imageFile`)[0])}
                                                                                    alt="New"
                                                                                    fill
                                                                                    style={{ objectFit: 'cover' }}
                                                                                />
                                                                            ) : watch(`variations.${index}.image`) ? (
                                                                                <Image
                                                                                    src={watch(`variations.${index}.image`)?.startsWith('http') ? watch(`variations.${index}.image`)! : `http://localhost:5000/${watch(`variations.${index}.image`)}`}
                                                                                    alt="Existing"
                                                                                    fill
                                                                                    style={{ objectFit: 'cover' }}
                                                                                />
                                                                            ) : (
                                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                                                                                    <FiUploadCloud size={16} color="#ccc" />
                                                                                </div>
                                                                            )}
                                                                            <input
                                                                                type="file"
                                                                                {...register(`variations.${index}.imageFile`)}
                                                                                accept="image/*"
                                                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '0.5rem' }}>
                                                                        <select {...register(`variations.${index}.type`)} className="form-select" style={{ fontSize: '0.85rem', padding: '0.3rem' }}>
                                                                            <option value="Size">Size</option>
                                                                            <option value="Color">Color</option>
                                                                            <option value="Weight">Weight (kg/gm)</option>
                                                                            <option value="Volume">Volume (L/ml)</option>
                                                                            <option value="Pack">Pack (Qty)</option>
                                                                            <option value="Battery">Battery</option>
                                                                            <option value="Range">Range</option>
                                                                            <option value="Storage">Storage</option>
                                                                            <option value="Other">Other</option>
                                                                        </select>
                                                                        <input type="hidden" {...register(`variations.${index}._id`)} />
                                                                    </td>
                                                                    <td style={{ padding: '0.5rem' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <input
                                                                                {...register(`variations.${index}.value.en`)}
                                                                                className="form-input"
                                                                                placeholder="Value (En)"
                                                                                list={`suggestions-${index}`}
                                                                                style={{
                                                                                    fontSize: '0.8.5rem',
                                                                                    padding: '0.3rem',
                                                                                    borderColor: errors.variations?.[index]?.value ? 'var(--danger)' : undefined
                                                                                }}
                                                                            />
                                                                            <input
                                                                                {...register(`variations.${index}.value.hi`)}
                                                                                className="form-input"
                                                                                placeholder="मूल्य (Hi)"
                                                                                list={`suggestions-hi-${index}`}
                                                                                style={{
                                                                                    fontSize: '0.85rem',
                                                                                    padding: '0.3rem',
                                                                                    borderColor: errors.variations?.[index]?.value ? 'var(--danger)' : undefined
                                                                                }}
                                                                            />
                                                                            <datalist id={`suggestions-${index}`}>
                                                                                {VARIATION_SUGGESTIONS[watch(`variations.${index}.type`)]?.map(opt => (
                                                                                    <option key={opt} value={opt} />
                                                                                ))}
                                                                            </datalist>
                                                                            <datalist id={`suggestions-hi-${index}`}>
                                                                                {VARIATION_SUGGESTIONS[watch(`variations.${index}.type`)]?.map(opt => (
                                                                                    <option key={opt} value={opt} />
                                                                                ))}
                                                                            </datalist>
                                                                        </div>
                                                                        {errors.variations?.[index]?.value && <span style={{ color: 'red', fontSize: '0.7rem' }}>Required</span>}
                                                                    </td>
                                                                    <td style={{ padding: '0.5rem' }}>
                                                                        <input type="number" {...register(`variations.${index}.mrp`)} className="form-input" placeholder="MRP" style={{ fontSize: '0.85rem', padding: '0.3rem', width: '80px' }} />
                                                                    </td>
                                                                    <td style={{ padding: '0.5rem' }}>
                                                                        <input
                                                                            type="number"
                                                                            {...register(`variations.${index}.price`)}
                                                                            className="form-input"
                                                                            placeholder="Price"
                                                                            style={{
                                                                                fontSize: '0.85rem', padding: '0.3rem', width: '80px',
                                                                                borderColor: (errors.variations?.[index]?.price || isInvalidPrice) ? 'var(--danger)' : undefined
                                                                            }}
                                                                        />
                                                                        {(errors.variations?.[index]?.price?.message || isInvalidPrice) && (
                                                                            <div style={{ color: 'var(--danger)', fontSize: '0.65rem', lineHeight: 1.1 }}>
                                                                                {errors.variations?.[index]?.price?.message || "MRP > Price"}
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    <td style={{ padding: '0.5rem' }}>
                                                                        <input type="number" {...register(`variations.${index}.stock`)} className="form-input" placeholder="Qty" style={{ fontSize: '0.85rem', padding: '0.3rem', width: '60px' }} />
                                                                    </td>
                                                                    <td style={{ padding: '0.5rem' }}>
                                                                        <input {...register(`variations.${index}.sku`)} className="form-input" placeholder="SKU" style={{ fontSize: '0.85rem', padding: '0.3rem', width: '100px' }} />
                                                                    </td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                        <input type="checkbox" {...register(`variations.${index}.isActive`)} />
                                                                    </td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                        <button type="button" onClick={() => remove(index)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                                            <FiX />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="card">
                        <div className="card-header">Pricing & Tax</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">HSN Code</label>
                                <select {...register("hsn_code")} className="form-select"
                                    onChange={(e) => {
                                        const hsn = hsns.find(h => h._id === e.target.value);
                                        if (hsn) setValue("gst_rate", hsn.gst_rate);
                                    }}
                                >
                                    <option value="">-- Select HSN --</option>
                                    {hsns.map(h => <option key={h._id} value={h._id}>{h.hsn_code} ({h.gst_rate}%)</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">GST Rate (%)</label>
                                <input type="number" {...register("gst_rate")} className="form-input" readOnly />
                            </div>
                        </div>

                        {variationMode === 'standard' && (
                            <div style={{ backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: 'var(--radius)', marginTop: '1.5rem', border: '1px solid var(--border)' }}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">MRP (₹)</label>
                                        <input type="number" {...register("mrp")} className="form-input" placeholder="0.00" style={{ fontWeight: 'bold', borderColor: errors.mrp ? 'var(--danger)' : undefined }} />
                                        {errors.mrp && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.mrp.message as string}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Selling Price A (₹)</label>
                                        <input type="number" {...register("selling_price_a")} className="form-input" placeholder="0.00" style={{ color: 'var(--success)', fontWeight: 'bold' }} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>You Save:</span>
                                    <span style={{ color: 'var(--success)', fontWeight: '600' }}>₹{youSave} ({youSavePercent}%)</span>
                                </div>
                            </div>
                        )}

                        {variationMode !== 'standard' && (
                            <div style={{ backgroundColor: '#F0F9FF', padding: '1rem', borderRadius: 'var(--radius)', marginTop: '1.5rem', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ color: '#0284C7' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#0369A1' }}>
                                    Prices for this product are <strong>managed via {variationMode === 'models' ? 'Models' : 'Variations'}</strong>.
                                    Main listing price will be auto-calculated (starting from ₹{effectiveSellingPrice}).
                                </div>
                            </div>
                        )}


                    </div>

                    <SpecificationManager control={control} register={register} errors={errors} />

                    {/* SEO Settings */}
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>SEO & Metadata</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 'normal' }}>Search Engine Optimization</span>
                        </div>
                        <div className="form-grid">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <BilingualInput
                                    label="Meta Title"
                                    registerEn={register("meta_title.en")}
                                    registerHi={register("meta_title.hi")}
                                    errorEn={errors.meta_title && (errors.meta_title as any).en}
                                    errorHi={errors.meta_title && (errors.meta_title as any).hi}
                                    placeholderEn="Title for search engines (max 60 chars)"
                                    placeholderHi="सर्च इंजन के लिए शीर्षक"
                                />
                                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '-1rem', marginBottom: '1rem', display: 'block' }}>
                                    Recommended length: 50-60 characters
                                </span>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <BilingualInput
                                    label="Meta Description"
                                    registerEn={register("meta_description.en")}
                                    registerHi={register("meta_description.hi")}
                                    errorEn={errors.meta_description && (errors.meta_description as any).en}
                                    errorHi={errors.meta_description && (errors.meta_description as any).hi}
                                    placeholderEn="Description for search results (max 160 chars)"
                                    placeholderHi="खोज परिणामों के लिए विवरण"
                                    multiline
                                    rows={3}
                                />
                                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '-1rem', display: 'block' }}>
                                    Recommended length: 150-160 characters
                                </span>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <BilingualInput
                                label="Keywords (Comma Separated)"
                                registerEn={register("keywords.en")}
                                registerHi={register("keywords.hi")}
                                errorEn={errors.keywords && (errors.keywords as any).en}
                                errorHi={errors.keywords && (errors.keywords as any).hi}
                                placeholderEn="e.g. tools, hammer, drill"
                                placeholderHi="उदा. औजार, हथौड़ा, ड्रिल"
                                multiline
                                rows={2}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '-0.5rem' }}>
                                Separate keywords with commas
                            </span>
                        </div>
                    </div>

                </div>

                {/* Right Column (Sidebar Info) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Status & Flags - Moved to top for visibility */}
                    <div className="card">
                        <div className="card-header">Status & Visibility</div>
                        <div className="form-grid">
                            <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" {...register("isVisible")} className="form-checkbox" />
                                <span>Visible on Site</span>
                            </label>
                            <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" {...register("isFeatured")} className="form-checkbox" />
                                <span>Featured Product</span>
                            </label>
                            <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" {...register("isNewArrival")} className="form-checkbox" />
                                <span>New Arrival</span>
                            </label>
                            <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" {...register("isTopSale")} className="form-checkbox" />
                                <span>Top Sale</span>
                            </label>
                            <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" {...register("isDailyOffer")} className="form-checkbox" />
                                <span>Daily Offer</span>
                            </label>
                            <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" {...register("isOnDemand")} className="form-checkbox" />
                                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span>On-Demand / Made-to-Order</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Never shows as out of stock</span>
                                </span>
                            </label>
                            <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" {...register("isCancellable")} className="form-checkbox" />
                                <span>Can be Cancelled (User)</span>
                            </label>
                            <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" {...register("isReturnable")} className="form-checkbox" />
                                <span>Can be Returned (User)</span>
                            </label>
                        </div>

                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <BilingualInput
                                        label="Delivery Estimate"
                                        registerEn={register("deliveryTime.en")}
                                        registerHi={register("deliveryTime.hi")}
                                        errorEn={errors.deliveryTime && (errors.deliveryTime as any).en}
                                        errorHi={errors.deliveryTime && (errors.deliveryTime as any).hi}
                                        placeholderEn="e.g. 3-5 business days"
                                        placeholderHi="उदा. 3-5 कार्य दिवस"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Return Window (Days)</label>
                                    <input type="number" {...register("returnWindow")} className="form-input" placeholder="7" />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Days after purchase to allow returns</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="card" style={{ overflow: 'visible' }}>
                        <div className="card-header">Classification</div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Category *</label>
                            <select {...register("category")} className="form-select" style={{ borderColor: errors.category ? 'var(--danger)' : undefined }}>
                                <option value="">-- Select Category --</option>
                                {categories.map(c => <option key={c._id} value={c._id}>
                                    {typeof c.name === 'string' ? c.name : (c.name[language] || c.name.en)}
                                </option>)}
                            </select>
                            {errors.category && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.category.message as string}</span>}
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Sub-Category</label>
                            <select {...register("sub_category")} className="form-select">
                                <option value="">-- Select Sub-Category --</option>
                                {subCategories.map(s => <option key={s._id} value={s._id}>
                                    {typeof s.name === 'string' ? s.name : (s.name[language] || s.name.en)}
                                </option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Brand</label>
                            <select {...register("brand")} className="form-select">
                                <option value="">-- Select Brand --</option>
                                {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Applied Offers</label>
                            <div className="custom-multiselect" ref={offerDropdownRef} style={{ position: 'relative' }}>
                                <div
                                    className="form-select"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        minHeight: '42px',
                                        height: 'auto',
                                        padding: '0.4rem 0.75rem',
                                        backgroundColor: '#fff',
                                        border: isOfferDropdownOpen ? '1px solid var(--primary)' : '1px solid #ddd',
                                        boxShadow: isOfferDropdownOpen ? '0 0 0 3px rgba(243, 112, 33, 0.1)' : 'none'
                                    }}
                                    onClick={() => setIsOfferDropdownOpen(!isOfferDropdownOpen)}
                                >
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                                        {(watch('offers') || []).length === 0 ? (
                                            <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Select Offers</span>
                                        ) : (
                                            <>
                                                {offers.filter(o => (watch('offers') || []).includes(o._id)).slice(0, 3).map(o => (
                                                    <span key={o._id} style={{
                                                        background: 'rgba(243, 112, 33, 0.1)',
                                                        color: '#F37021',
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        border: '1px solid rgba(243, 112, 33, 0.2)'
                                                    }}>
                                                        {o.title}
                                                        <FiX
                                                            size={12}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const currentOffers = watch('offers') || [];
                                                                setValue('offers', currentOffers.filter((id: string) => id !== o._id));
                                                            }}
                                                        />
                                                    </span>
                                                ))}
                                                {(watch('offers') || []).length > 3 && (
                                                    <span style={{ fontSize: '0.8rem', color: '#64748B', alignSelf: 'center', fontWeight: 500 }}>
                                                        +{(watch('offers') || []).length - 3} more
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <FiChevronDown style={{
                                        color: '#64748B',
                                        transform: isOfferDropdownOpen ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s',
                                        marginLeft: '0.5rem'
                                    }} />
                                </div>

                                {isOfferDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 5px)',
                                        left: 0,
                                        right: 0,
                                        zIndex: 1000,
                                        background: 'white',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                        maxHeight: '250px',
                                        overflowY: 'auto',
                                        padding: '0.5rem'
                                    }}>
                                        {offers.length === 0 ? (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>No offers available</div>
                                        ) : (
                                            offers.map(o => {
                                                const isChecked = (watch('offers') || []).includes(o._id);
                                                return (
                                                    <label key={o._id} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.6rem 0.75rem',
                                                        cursor: 'pointer',
                                                        borderRadius: '8px',
                                                        transition: 'all 0.2s',
                                                        backgroundColor: isChecked ? '#FFF7ED' : 'transparent',
                                                        marginBottom: '2px'
                                                    }}
                                                        onMouseEnter={(e) => !isChecked && (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                                                        onMouseLeave={(e) => !isChecked && (e.currentTarget.style.backgroundColor = 'transparent')}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            value={o._id}
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                const currentOffers = watch('offers') || [];
                                                                if (e.target.checked) {
                                                                    setValue('offers', [...currentOffers, o._id]);
                                                                } else {
                                                                    setValue('offers', currentOffers.filter((id: string) => id !== o._id));
                                                                }
                                                            }}
                                                            style={{
                                                                display: 'none'
                                                            }}
                                                        />
                                                        {isChecked ? (
                                                            <FiCheckCircle size={18} style={{ color: '#F37021', flexShrink: 0 }} />
                                                        ) : (
                                                            <div style={{
                                                                width: '18px',
                                                                height: '18px',
                                                                borderRadius: '50%',
                                                                border: '2px solid #E2E8F0',
                                                                flexShrink: 0,
                                                                backgroundColor: '#fff'
                                                            }} />
                                                        )}
                                                        <div style={{ display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
                                                            <span style={{ fontSize: '0.875rem', fontWeight: isChecked ? 600 : 500, color: isChecked ? '#9A3412' : '#1E293B' }}>{o.title}</span>
                                                            <span style={{ fontSize: '0.75rem', color: isChecked ? '#C2410C' : '#64748B' }}>{o.percentage}% Discount</span>
                                                        </div>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Media - Product Images (New System) */}
                    <div className="card" id="media-section">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Product Images</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsImageModalOpen(true);
                                    setImageError(false);
                                }}
                                className="btn btn-sm btn-secondary"
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '0.3rem 0.6rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    borderColor: imageError ? 'var(--danger)' : undefined,
                                    borderWidth: imageError ? '2px' : '1px',
                                    color: imageError ? 'var(--danger)' : undefined
                                }}
                            >
                                <FiEdit2 /> Manage Images
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                            {productImages.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem', border: '1px dashed #eee', borderRadius: '8px' }}>
                                    No images added. Click &quot;Manage Images&quot; to add.
                                </div>
                            ) : (
                                productImages.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: img.isMain ? '2px solid var(--primary)' : '1px solid #eee' }}>
                                        <Image
                                            src={img.file ? URL.createObjectURL(img.file) : (img.url || '')}
                                            alt={img.altText}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                        {img.isMain && (
                                            <div style={{ position: 'absolute', top: 0, left: 0, background: 'var(--primary)', color: 'white', padding: '2px 4px', fontSize: '0.6rem', fontWeight: 'bold' }}>MAIN</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className="card">
                        <div className="card-header">Inventory</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Opening Stock</label>
                                {variationMode === 'standard' ? (
                                    <input type="number" {...register("opening_stock")} className="form-input" />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <input
                                            type="number"
                                            value={effectiveOpeningStock}
                                            className="form-input"
                                            readOnly
                                            style={{ backgroundColor: '#F8FAFC', cursor: 'not-allowed', fontWeight: 'bold' }}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>
                                            Total from {variationMode === 'models' ? 'Models' : 'Variations'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Low Stock Alert</label>
                                <input type="number" {...register("low_stock_threshold")} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Max Buy/User</label>
                                <input type="number" {...register("max_unit_buy")} className="form-input" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* Image Manager Modal */}
            <FormModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                title="Manage Product Images (Max 5)"
                maxWidth="800px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={handleAddImageSlot} className="btn btn-sm btn-primary" disabled={productImages.length >= 5}>
                            <FiPlus /> Add Image
                        </button>
                    </div>

                    {productImages.map((img, idx) => (
                        <div key={img.id || idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', background: '#f9f9f9' }}>
                            {/* Image Upload/Preview */}
                            <div style={{ width: '100px', height: '100px', flexShrink: 0, position: 'relative', border: '1px dashed #ccc', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                                {img.file ? (
                                    <Image src={URL.createObjectURL(img.file)} alt="Preview" fill style={{ objectFit: 'contain' }} />
                                ) : img.url ? (
                                    <Image src={img.url} alt="Existing" fill style={{ objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                        <FiUploadCloud size={24} />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleImageChange(idx, 'file', e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>

                            {/* Details */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Alt Text (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ fontSize: '0.9rem', padding: '0.3rem' }}
                                        placeholder="Descriptive text for SEO"
                                        value={img.altText}
                                        onChange={(e) => handleImageChange(idx, 'altText', e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input
                                            type="radio"
                                            name="mainImageGroup"
                                            checked={img.isMain}
                                            onChange={() => handleImageChange(idx, 'isMain', true)}
                                        />
                                        <span style={{ fontWeight: img.isMain ? 'bold' : 'normal' }}>Set as Main Image</span>
                                    </label>
                                </div>
                            </div>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={() => handleRemoveImageSlot(idx)}
                                style={{ padding: '0.5rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <FiTrash2 size={18} />
                            </button>
                        </div>
                    ))}

                    <div style={{ textAlign: 'right', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsImageModalOpen(false)}
                            className="btn btn-primary"
                        >
                            Done
                        </button>
                    </div>
                </div>

            </FormModal>

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
        </div >
    );
}
