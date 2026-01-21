# 🚀 Quick Start - Admin Panel TODO

## What You Need to Build Next

### 1. Category Management Page
**File**: `frontend/src/app/admin/categories/page.tsx`

```tsx
// Features needed:
- Table showing all categories
- Add/Edit/Delete buttons
- Image upload for category images
- Gradient color picker
- Display order input
- Active/Inactive toggle
```

**API Endpoints to Use**:
- GET `/api/categories` - List all
- POST `/api/categories` - Create
- PUT `/api/categories/:id` - Update
- DELETE `/api/categories/:id` - Delete

---

### 2. Special Offers Management Page
**File**: `frontend/src/app/admin/special-offers/page.tsx`

```tsx
// Features needed:
- Table showing all offers (active + expired)
- Product dropdown selector
- Date range picker (start/end dates)
- Price inputs with auto-calculate discount %
- Badge selector dropdown
- Limited stock checkbox
- Preview countdown timer
```

**API Endpoints to Use**:
- GET `/api/special-offers/admin/all` - List all (including expired)
- POST `/api/special-offers` - Create
- PUT `/api/special-offers/:id` - Update
- DELETE `/api/special-offers/:id` - Delete
- GET `/api/products` - For product dropdown

---

### 3. Homepage Features Management
**File**: `frontend/src/app/admin/homepage/features/page.tsx`

```tsx
// Features needed:
- Table showing all features
- Icon image upload
- Color picker for feature color
- Stats badge input
- Display order with drag-drop
```

**API Endpoints to Use**:
- GET `/api/homepage/features` - List all
- POST `/api/homepage/features` - Create
- PUT `/api/homepage/features/:id` - Update
- DELETE `/api/homepage/features/:id` - Delete

---

### 4. Trust Indicators Management
**File**: `frontend/src/app/admin/homepage/trust-indicators/page.tsx`

```tsx
// Features needed:
- Simple table with label/value
- Add/Edit/Delete buttons
- Display order input
```

**API Endpoints to Use**:
- GET `/api/homepage/trust-indicators` - List all
- POST `/api/homepage/trust-indicators` - Create
- PUT `/api/homepage/trust-indicators/:id` - Update
- DELETE `/api/homepage/trust-indicators/:id` - Delete

---

## Sample Admin Form Component

```tsx
// Example: Add Category Form
'use client';

import { useState } from 'react';

export default function AddCategoryForm() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    displayOrder: 0,
    isActive: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const res = await fetch('http://localhost:5000/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert('Category created!');
      // Refresh list or redirect
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Category Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <input
        type="text"
        placeholder="Slug (e.g., engine-parts)"
        value={formData.slug}
        onChange={(e) => setFormData({...formData, slug: e.target.value})}
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      <input
        type="text"
        placeholder="Image URL"
        value={formData.imageUrl}
        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
      />
      <input
        type="text"
        placeholder="Gradient CSS"
        value={formData.gradient}
        onChange={(e) => setFormData({...formData, gradient: e.target.value})}
      />
      <input
        type="number"
        placeholder="Display Order"
        value={formData.displayOrder}
        onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})}
      />
      <label>
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
        />
        Active
      </label>
      <button type="submit">Create Category</button>
    </form>
  );
}
```

---

## Update AdminSidebar

Add these menu items to your admin sidebar:

```tsx
// In AdminSidebar.tsx
<Link href="/admin/categories">
  📦 Categories
</Link>
<Link href="/admin/special-offers">
  ⚡ Special Offers
</Link>
<Link href="/admin/homepage/features">
  ⭐ Homepage Features
</Link>
<Link href="/admin/homepage/trust-indicators">
  🏆 Trust Indicators
</Link>
```

---

## Priority Order

1. **Categories** (High Priority)
   - Most visible on homepage
   - Affects navigation
   
2. **Special Offers** (High Priority)
   - Drives conversions
   - Time-sensitive

3. **Features** (Medium Priority)
   - Static content
   - Less frequent updates

4. **Trust Indicators** (Low Priority)
   - Rarely changes
   - Simple to manage

---

## Quick Test Commands

```bash
# Test category creation
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "slug": "test-category",
    "imageUrl": "/test.jpg",
    "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  }'

# Test special offer creation (replace PRODUCT_ID)
curl -X POST http://localhost:5000/api/special-offers \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "title": "Test Offer",
    "badge": "HOT DEAL",
    "discountPercent": 25,
    "originalPrice": 1000,
    "offerPrice": 750,
    "startDate": "2026-01-21T00:00:00Z",
    "endDate": "2026-01-28T23:59:59Z",
    "isLimitedStock": true
  }'
```

---

## Image Upload Recommendations

For image uploads, consider:

1. **Base64 encoding** (simple, already supported)
2. **Cloudinary** (recommended for production)
3. **AWS S3** (scalable)
4. **Local storage** (development only)

Example with base64:
```tsx
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onloadend = () => {
    setFormData({...formData, imageUrl: reader.result});
  };
  
  reader.readAsDataURL(file);
};
```

---

That's it! Start with the Categories admin page and work your way down. All the backend APIs are ready to use! 🚀
