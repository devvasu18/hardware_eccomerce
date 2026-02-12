# Product-Offer Linking Analysis

## 📌 Overview
In the **Product Manager**, offers are linked to products via the **Product Form** (used for both creating and editing products). The relationship is **Many-to-Many** (sort of, from Product side), meaning a Product can have multiple Offers applied to it.

## ⚙️ Implementation Details

### 1. Data Structure
- **Frontend State**: `offers` array in `ProductForm` component holds the list of all available offers fetched from the backend.
- **Form State**: The `offers` field in the React Hook Form schema stores an array of Offer IDs selected for the current product.
- **Backend Model**: The `Product` model has an `offers` field:
  ```javascript
  offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }]
  ```

### 2. User Interface
- **Location**: The specific control is located in the **"Classification"** card (Right Column) of the Product Form.
- **Component**: A scrollable list of checkboxes (`<input type="checkbox">`) representing all active offers.
- **Interaction**:
  - The admin can select multiple offers.
  - Each option displays the **Offer Title** and **Percentage**.
  
### 3. Data Flow
1.  **Fetching**: On load, `ProductForm` fetches all offers via `GET /admin/offers`.
2.  **Selection**: When a checkbox is toggled, the corresponding Offer ID is added/removed from the `offers` array in the form's local state using `setValue`.
3.  **Submission**:
    - On Save, the `offers` array is processed.
    - Since it's an array, it is converted to a comma-separated string of IDs before being appended to `FormData` (lines 605-606).
    - `formData.append('offers', "id1,id2,id3")`
    - The backend receives this and updates the Product document.

## 🔍 Code Reference
**File**: `frontend/src/app/admin/components/ProductForm.tsx`

**Fetching Logic**:
```typescript
const [offers, setOffers] = useState<any[]>([]);
// ...
api.get('/admin/offers') // In useEffect
```

**UI Rendering (Lines 1332-1353)**:
```typescript
<label className="form-label">Applied Offers</label>
<div style={{ maxHeight: '150px', overflowY: 'auto', ... }}>
    {offers.map(o => (
        <label key={o._id} ...>
            <input
                type="checkbox"
                value={o._id}
                checked={watch('offers')?.includes(o._id) || false}
                onChange={(e) => { ... }} // Toggles ID in 'offers' array
            />
            <span>{o.title} ({o.percentage}%)</span>
        </label>
    ))}
</div>
```

## ✅ Conclusion
The system successfully allows linking products to offers directly from the Product Edit/Create screen. The implementation supports multiple offers per product and uses a straightforward checkbox interface.
