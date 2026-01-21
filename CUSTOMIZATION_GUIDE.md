# 🛠️ Customization Guide - New Homepage Sections

## Quick Customization Tips

### 1. CategorySection - Update Categories

**File**: `frontend/src/app/components/CategorySection.tsx`

**To add/modify categories**, edit the `categories` array (line 14):

```typescript
const categories: Category[] = [
  {
    id: 'your-category-slug',        // URL-friendly ID
    name: 'Your Category Name',       // Display name
    icon: '🔧',                       // Emoji icon
    productCount: 42,                 // Number of products
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'  // Custom gradient
  },
  // Add more categories...
];
```

**Popular gradient combinations**:
```css
/* Purple */
linear-gradient(135deg, #667eea 0%, #764ba2 100%)

/* Pink */
linear-gradient(135deg, #f093fb 0%, #f5576c 100%)

/* Blue */
linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)

/* Green */
linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)

/* Orange */
linear-gradient(135deg, #fa709a 0%, #fee140 100%)

/* Teal */
linear-gradient(135deg, #30cfd0 0%, #330867 100%)
```

**To connect to real product counts**:
```typescript
// Replace static array with API call
async function getCategories() {
  const res = await fetch('http://localhost:5000/api/categories');
  return res.json();
}
```

---

### 2. SpecialOffers - Update Deals

**File**: `frontend/src/app/components/SpecialOffers.tsx`

**To modify deals**, edit the `deals` array (line 22):

```typescript
const deals: Deal[] = [
  {
    id: '1',
    productName: 'Your Product Name',
    category: 'Category',
    originalPrice: 8999,              // Original price
    discountedPrice: 5999,            // Discounted price
    discountPercent: 33,              // Discount %
    image: '/path/to/image.jpg',      // Product image
    endsIn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    badge: 'HOT DEAL',                // Badge text
    limited: true                     // Show "Limited Stock"?
  },
];
```

**Badge options**:
- `'HOT DEAL'` - Red background
- `'BUNDLE OFFER'` - Dark background
- `'CLEARANCE'` - Dark background
- `'FLASH SALE'` - Custom text
- `'NEW ARRIVAL'` - Custom text

**To fetch from backend**:
```typescript
async function getSpecialOffers() {
  const res = await fetch('http://localhost:5000/api/products/deals');
  return res.json();
}

// Then use in component:
const [deals, setDeals] = useState<Deal[]>([]);

useEffect(() => {
  getSpecialOffers().then(setDeals);
}, []);
```

**To change timer duration**:
```typescript
// 1 day
endsIn: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)

// 3 days
endsIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

// 1 week
endsIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

// Specific date
endsIn: new Date('2026-02-01T23:59:59')
```

---

### 3. WhyChooseUs - Update Features

**File**: `frontend/src/app/components/WhyChooseUs.tsx`

**To modify features**, edit the `features` array (line 13):

```typescript
const features: Feature[] = [
  {
    id: 'unique-id',
    title: 'Feature Title',
    description: 'Detailed description of this feature...',
    icon: '✓',                        // Emoji or symbol
    color: '#10b981',                 // Hex color
    stats: '100% Certified'           // Optional badge text
  },
];
```

**Recommended colors**:
```typescript
'#10b981'  // Green (quality, success)
'#3b82f6'  // Blue (trust, delivery)
'#f59e0b'  // Orange (value, pricing)
'#8b5cf6'  // Purple (premium, support)
'#ec4899'  // Pink (technology, modern)
'#f37021'  // Primary orange (brand)
'#ef4444'  // Red (urgency, important)
```

**To update trust indicators** (line 88):
```typescript
<div className="trust-indicators">
  <div className="trust-item">
    <div className="trust-number">1000+</div>
    <div className="trust-label">Happy Clients</div>
  </div>
  // Add more trust items...
</div>
```

---

## 🎨 Styling Customization

### Change Section Background Colors

**CategorySection.css**:
```css
.category-section {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  /* Change to your preferred gradient */
}
```

**SpecialOffers.css**:
```css
.special-offers {
  background: linear-gradient(180deg, #ffffff 0%, #fef3c7 50%, #ffffff 100%);
  /* Yellow theme - change to match your brand */
}
```

**WhyChooseUs.css**:
```css
.why-choose-us {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%);
  /* Subtle grey gradient */
}
```

### Change Primary Colors

All sections use CSS variables from `globals.css`:
```css
:root {
  --primary: #F37021;      /* Change this to your brand color */
  --secondary: #0F172A;    /* Dark color for text/headings */
  --text-muted: #64748B;   /* Muted text color */
}
```

### Adjust Spacing

```css
/* Reduce section padding */
.category-section {
  padding: 3rem 0;  /* Default: 5rem 0 */
}

/* Increase gap between cards */
.categories-grid {
  gap: 3rem;  /* Default: 1.5rem */
}
```

---

## 🔗 Link Customization

### CategorySection Links
```tsx
// Line 67 - Update category link destination
<Link href={`/products?category=${category.id}`}>
  
// Change to:
<Link href={`/category/${category.id}`}>
```

### SpecialOffers Links
```tsx
// Line 136 - Update deal link
<Link href={`/products/${deal.id}`}>

// Change to:
<Link href={`/deals/${deal.id}`}>
```

---

## 📱 Responsive Breakpoints

To change when sections stack to single column:

```css
/* Default breakpoint: 768px */
@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}

/* Change to 1024px for earlier stacking */
@media (max-width: 1024px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🎯 Section Reordering

To change the order of sections on the homepage:

**File**: `frontend/src/app/page.tsx`

```tsx
<main>
  <Header />
  <HeroSlider />
  
  {/* Featured Products */}
  <section>...</section>
  
  {/* Reorder these as needed */}
  <CategorySection />      // 1st
  <SpecialOffers />        // 2nd
  <WhyChooseUs />          // 3rd
  
  <footer>...</footer>
</main>
```

**Recommended orders**:

**For maximum conversions**:
1. Featured Products
2. Special Offers (urgency)
3. Categories (navigation)
4. Why Choose Us (trust)

**For exploration**:
1. Featured Products
2. Categories (navigation)
3. Why Choose Us (trust)
4. Special Offers (final push)

**For B2B focus**:
1. Featured Products
2. Why Choose Us (trust first)
3. Categories (navigation)
4. Special Offers (deals)

---

## 🚀 Performance Optimization

### Lazy Load Sections

```tsx
import dynamic from 'next/dynamic';

const CategorySection = dynamic(() => import('@/app/components/CategorySection'));
const SpecialOffers = dynamic(() => import('@/app/components/SpecialOffers'));
const WhyChooseUs = dynamic(() => import('@/app/components/WhyChooseUs'));
```

### Reduce Animation Complexity

```css
/* Disable animations on mobile for better performance */
@media (max-width: 768px) {
  .feature-card {
    transition: none;
  }
  
  .feature-card:hover {
    transform: none;
  }
}
```

---

## 🎨 Brand Customization Examples

### Example 1: Blue Theme
```css
:root {
  --primary: #3b82f6;  /* Blue */
}

.flash-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
```

### Example 2: Green Theme
```css
:root {
  --primary: #10b981;  /* Green */
}

.flash-badge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```

### Example 3: Purple Theme
```css
:root {
  --primary: #8b5cf6;  /* Purple */
}

.flash-badge {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}
```

---

## 📊 A/B Testing Ideas

1. **Test section order** - Track which order gets more conversions
2. **Test CTA text** - "Grab This Deal" vs "Shop Now" vs "Buy Now"
3. **Test timer urgency** - Shorter vs longer deadlines
4. **Test color schemes** - Different primary colors
5. **Test badge text** - "HOT DEAL" vs "FLASH SALE" vs "LIMITED TIME"

---

## 🔧 Common Modifications

### Remove a section
```tsx
// Simply comment out or delete the component
// <SpecialOffers />
```

### Duplicate a section
```tsx
<SpecialOffers />
<SpecialOffers />  // Shows twice
```

### Add custom content between sections
```tsx
<CategorySection />

<section className="custom-banner">
  <div className="container">
    <h2>Custom Content Here</h2>
  </div>
</section>

<SpecialOffers />
```

---

## 📝 Quick Reference

**Files to edit**:
- Content: `*.tsx` files
- Styling: `*.css` files
- Colors: `globals.css` (CSS variables)
- Layout: `page.tsx`

**Key variables**:
- `--primary`: Main brand color
- `--secondary`: Dark color for text
- `--text-muted`: Secondary text color

**Common changes**:
1. Update categories → `CategorySection.tsx` line 14
2. Update deals → `SpecialOffers.tsx` line 22
3. Update features → `WhyChooseUs.tsx` line 13
4. Change colors → `globals.css` line 3-16
5. Reorder sections → `page.tsx` line 57-61

---

Need help with customization? Check the component files for detailed comments and structure! 🚀
