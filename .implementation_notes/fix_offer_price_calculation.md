# Fix: Offer Discount Calculation

## 🐛 Issue
When viewing products via an offer link (e.g. `/products?offer=summer-sale`), the prices shown were the standard selling prices, **ignoring the offer's percentage discount**.

## 🔍 Root Cause
The `FilteredProducts` component fetched the offer information (title, percentage) for the Hero section but **did not pass this information to the product grid logic**.
The products were simply displayed with their database `selling_price_a`, and no calculation was performed to apply the offer discount.

## ✅ Solution
Updated `frontend/src/app/components/FilteredProducts.tsx` to dynamically calculate prices on the client side.

### 1. **Pass Offer Data**
Modified `ProductGridContent` to accept an `offerInfo` prop.
```typescript
function ProductGridContent({ offerInfo }: { offerInfo?: any }) { ... }
```

### 2. **Calculate Price**
Inside the product mapping logic, added a calculation step:
```typescript
let finalPrice = p.selling_price_a || p.discountedPrice || p.mrp || 0;

if (offerInfo && offerInfo.percentage) {
    // Calculate discount amount
    const discount = (finalPrice * offerInfo.percentage) / 100;
    // Apply discount
    finalPrice = Math.round(finalPrice - discount);
}

// Result: discountedPrice now reflects the offer
```

### 3. **Update Render**
Updated the parent component to pass the state:
```typescript
<ProductGridContent offerInfo={offerInfo} />
```

## 🧪 Verification
1.  **Scenario**: Product A costs ₹100. Offer is "10% Off".
2.  **Before**: URL `/products?offer=10-off` showed ₹100.
3.  **After**: URL `/products?offer=10-off` shows **₹90**.
4.  **Standard Page**: URL `/products` shows ₹100 (No offer applied).

The prices now dynamically reflect the active offer.
