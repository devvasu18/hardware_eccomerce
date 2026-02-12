# Banner Offer Integration - Quick Reference

## 🎯 How It Works

### Scenario: Summer Sale Banner

```
┌─────────────────────────────────────────────────────────────┐
│                    HOMEPAGE BANNER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │   🏷️ SUMMER SALE                                     │  │
│  │   Get 25% OFF on selected products!                  │  │
│  │                                                       │  │
│  │   [Shop Now]  [Explore Products] ← User clicks here  │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  Banner linked to: Offer "Summer Sale" (slug: summer-sale)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    User is redirected to:
                /products?offer=summer-sale
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTS PAGE                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Summer Sale (25% OFF)                                │  │
│  │  Discover all products eligible for our exclusive     │  │
│  │  Summer Sale promotion. Save 25% on these items!      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Products shown: Only those with offer = "Summer Sale"     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │Product 1│  │Product 2│  │Product 3│                    │
│  │25% OFF  │  │25% OFF  │  │25% OFF  │                    │
│  └─────────┘  └─────────┘  └─────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Admin Setup Steps

### Step 1: Create an Offer
```
/admin/masters/offers → Create New Offer
- Title: "Summer Sale"
- Percentage: 25
- Slug: summer-sale (auto-generated)
- Active: ✓
```

### Step 2: Link Products to Offer
```
/admin/products → Edit Product
- Select Offer: "Summer Sale (25%)"
- Save
```

### Step 3: Create Banner with Offer Link
```
/admin/banners/add
- Title: "Summer Sale 2026"
- Target Link: "Link to Specific Offer"
- Select Offer: "Summer Sale (25%)"
- Button Text: "Shop Now"
- Show "Explore Products" Button: ✓
- Save
```

---

## 🔗 URL Structure

| Link Type | URL | Shows |
|-----------|-----|-------|
| **No Offer** | `/products` | All products |
| **With Offer** | `/products?offer=summer-sale` | Only products with "Summer Sale" offer |
| **With Category** | `/products?category=electronics` | Products in category |
| **Combined** | `/products?offer=summer-sale&category=electronics` | Offer products in category |

---

## 💻 Code Examples

### Frontend - HeroSlider Button
```typescript
<Link
  href={slide.offer_id ? `/products?offer=${slide.offer_id.slug}` : '/products'}
  className="hero-btn-secondary"
>
  <FiPlay />
  <span>Explore Products</span>
</Link>
```

### Frontend - FilteredProducts Hero
```typescript
<h1>
  {offerInfo ? (
    <>
      {offerInfo.title} <span className="text-orange-600">({offerInfo.percentage}% OFF)</span>
    </>
  ) : 'Industrial Catalog'}
</h1>
```

### Backend - Product Filtering
```javascript
// In productRoutes.js
if (req.query.offerSlug) {
    const Offer = require('../models/Offer');
    const offerDoc = await Offer.findOne({ slug: req.query.offerSlug });
    if (offerDoc) {
        query.offer = offerDoc._id;
    }
}
```

---

## 🎨 Visual States

### State 1: Banner with Offer
```
Banner → offer_id: ObjectId("...")
         ↓
"Explore Products" → /products?offer=summer-sale
```

### State 2: Banner without Offer
```
Banner → offer_id: null
         ↓
"Explore Products" → /products
```

### State 3: Banner with Manual Products
```
Banner → product_ids: [ObjectId("..."), ObjectId("...")]
         offer_id: null
         ↓
"Explore Products" → /products
```

---

## 🐛 Troubleshooting

### Issue: "Explore Products" shows all products, not offer products
**Solution**: 
1. Check if banner has `offer_id` set
2. Verify offer has products linked to it
3. Check browser console for errors

### Issue: Products page shows "No products found"
**Solution**:
1. Verify offer slug is correct in URL
2. Check if products have the offer assigned
3. Ensure offer is active (`isActive: true`)

### Issue: Offer title not showing on products page
**Solution**:
1. Check if `/api/admin/offers?slug={slug}` returns data
2. Verify offer slug matches exactly
3. Check browser console for API errors

---

## ✅ Testing Checklist

- [ ] Create offer in admin
- [ ] Link products to offer
- [ ] Create banner with offer link
- [ ] Visit homepage
- [ ] Click "Explore Products" on banner
- [ ] Verify URL has `?offer={slug}`
- [ ] Verify page shows offer title and percentage
- [ ] Verify only offer products are displayed
- [ ] Test with banner without offer (should show all products)

---

## 📊 Database Schema

```javascript
// Banner Model
{
  _id: ObjectId,
  title: String,
  offer_id: ObjectId → Offer,  // Links to offer
  product_ids: [ObjectId],      // Auto-populated from offer
  buttonLink: String,
  showSecondaryButton: Boolean
}

// Offer Model
{
  _id: ObjectId,
  title: String,
  slug: String (unique),
  percentage: Number,
  isActive: Boolean
}

// Product Model
{
  _id: ObjectId,
  title: String,
  offer: ObjectId → Offer,  // Links product to offer
  // ... other fields
}
```

---

**Quick Start**: Create offer → Link products → Create banner → Test! 🚀
