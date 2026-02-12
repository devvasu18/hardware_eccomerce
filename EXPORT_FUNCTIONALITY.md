# Export/Import Functionality Implementation

## Overview
This document outlines the comprehensive export/import functionality added to all admin panel endpoints that display data in tables. Users can now export data in CSV, Excel, and PDF formats with a clean, professional UI.

## Features Implemented

### 1. Backend Infrastructure

#### Export Helper Utility (`backend/utils/exportHelper.js`)
- **Purpose**: Centralized export logic for all data formats
- **Supported Formats**:
  - **CSV**: Plain text comma-separated values
  - **Excel**: `.xlsx` format with styled headers and auto-fit columns
  - **PDF**: Landscape A4 format with tables, pagination, and headers
- **Features**:
  - Automatic column width adjustment
  - Professional styling (bold headers, colored backgrounds for Excel)
  - Pagination support for PDF
  - Error handling and validation

#### Export Controller (`backend/controllers/exportController.js`)
Centralized export functions for all major entities:

1. **Orders Export** (`exportOrders`)
   - Fields: Order ID, Invoice Number, Customer, Email, Phone, Total Amount, Payment Method, Payment Status, Status, Order Date, Shipping Address
   - Filters: Status, Payment Status

2. **Users Export** (`exportUsers`)
   - Fields: ID, Username, Email, Mobile, Role, Customer Type, Wholesale Discount, Joined Date, Status
   - No filters (exports all users)

3. **Transactions Export** (`exportTransactions`)
   - Fields: Payment ID, Order ID, User, Email, Amount, Method, Status, Date, Gateway
   - Filters: Status, Method

4. **Procurement Requests Export** (`exportRequests`)
   - Fields: Request ID, Customer, Email, Phone, Product Name, Quantity, Status, Quoted Price, Request Date
   - Filters: Status

5. **Refund Requests Export** (`exportRefunds`)
   - Fields: Refund ID, Order ID, Customer, Email, Type, Reason, Amount, Status, Request Date
   - Filters: Status

6. **Brands Export** (`exportBrands`)
   - Fields: ID, Name, Slug, Categories
   - No filters

7. **HSN Codes Export** (`exportHSNCodes`)
   - Fields: ID, HSN Code, Description, GST Rate
   - No filters

8. **Offers Export** (`exportOffers`)
   - Fields: ID, Title, Slug, Percentage, Status
   - No filters

### 2. Backend Routes Updated

All the following routes now have export endpoints:

```javascript
// Orders
GET /api/orders/export?format=csv|excel|pdf&status=...&paymentStatus=...

// Users
GET /api/users/export?format=csv|excel|pdf

// Transactions
GET /api/transactions/export?format=csv|excel|pdf&status=...&method=...

// Procurement Requests
GET /api/requests/export?format=csv|excel|pdf&status=...

// Refund Requests
GET /api/refunds/export?format=csv|excel|pdf&status=...

// Brands
GET /api/admin/masters/brands/export?format=csv|excel|pdf

// HSN Codes
GET /api/admin/masters/hsn/export?format=csv|excel|pdf

// Offers
GET /api/admin/masters/offers/export?format=csv|excel|pdf

// Categories (already existed)
GET /api/admin/masters/categories/export?format=csv|excel

// Sub-Categories (already existed)
GET /api/admin/masters/sub-categories/export?format=csv|excel
```

### 3. Frontend Components

#### ExportButton Component (`frontend/src/app/components/ExportButton.tsx`)
- **Purpose**: Reusable export button with dropdown menu
- **Features**:
  - Hover-activated dropdown menu
  - Three format options: CSV, Excel, PDF
  - Icons for each format
  - Smooth animations
  - Loading state support
  - Customizable formats (can disable specific formats)
- **Props**:
  ```typescript
  interface ExportButtonProps {
      onExport: (format: 'csv' | 'excel' | 'pdf') => Promise<void> | void;
      formats?: ('csv' | 'excel' | 'pdf')[];
      loading?: boolean;
  }
  ```

### 4. Frontend Pages Updated

The following admin pages now have export functionality:

1. **Orders** (`/admin/orders`)
   - Export button in page header
   - Respects current status filter
   - Downloads as `orders_YYYY-MM-DD.{ext}`

2. **Users** (`/admin/users`)
   - Export button next to "Add New User"
   - Exports all users
   - Downloads as `users_YYYY-MM-DD.{ext}`

3. **Transactions** (`/admin/transactions`)
   - Export button in page header
   - Respects current status filter
   - Downloads as `transactions_YYYY-MM-DD.{ext}`

4. **Products** (already existed)
   - Export functionality was already implemented
   - Downloads as `products_YYYY-MM-DD.{ext}`

5. **Categories** (already existed)
   - Export functionality was already implemented

6. **Sub-Categories** (already existed)
   - Export functionality was already implemented

### 5. Pages That Need Export (To Be Added)

The following pages have tables but don't have export yet:

1. **Procurement Requests** (`/admin/requests`)
   - Route exists: `/api/requests/export`
   - Need to add ExportButton to frontend

2. **Refund Requests** (`/admin/returns`)
   - Route exists: `/api/refunds/export`
   - Need to add ExportButton to frontend

3. **Brands** (`/admin/masters/brands`)
   - Route exists: `/api/admin/masters/brands/export`
   - Need to add ExportButton to frontend

4. **HSN Codes** (`/admin/masters/hsn`)
   - Route exists: `/api/admin/masters/hsn/export`
   - Need to add ExportButton to frontend

5. **Offers** (`/admin/masters/offers`)
   - Route exists: `/api/admin/masters/offers/export`
   - Need to add ExportButton to frontend

6. **Stock** (`/admin/stock`)
   - Need to create export route and add button

7. **Coupons** (`/admin/coupons`)
   - Need to create export route and add button

8. **Banners** (`/admin/banners`)
   - Need to create export route and add button

9. **Special Deals** (`/admin/special-deals`)
   - Need to create export route and add button

10. **Logs** (`/admin/logs`)
    - Need to create export route and add button

## How to Add Export to a New Page

### Step 1: Backend - Add Export Function

If the export function doesn't exist in `exportController.js`, add it:

```javascript
exports.exportYourEntity = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const { filterField } = req.query;
        
        const query = {};
        if (filterField) query.filterField = filterField;
        
        const data = await YourModel.find(query)
            .populate('relatedField', 'fieldName')
            .sort({ createdAt: -1 })
            .lean();
        
        const formattedData = data.map(item => ({
            Field1: item.field1,
            Field2: item.field2,
            // ... map all fields
        }));
        
        const config = {
            filename: `your_entity_${new Date().toISOString().split('T')[0]}`,
            title: 'Your Entity Export',
            fields: ['Field1', 'Field2', ...],
            columns: [
                { header: 'Field 1', key: 'Field1', width: 25 },
                { header: 'Field 2', key: 'Field2', width: 25 },
                // ... define all columns
            ],
            headers: ['Field 1', 'Field 2', ...],
            keys: ['Field1', 'Field2', ...],
            sheetName: 'Your Entity'
        };
        
        await ExportHelper.export(format, formattedData, config, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

### Step 2: Backend - Add Route

In your route file:

```javascript
const { exportYourEntity } = require('../controllers/exportController');

router.get('/export', protect, admin, exportYourEntity);
```

### Step 3: Frontend - Add Export Handler

In your page component:

```typescript
import ExportButton from "../../components/ExportButton";

const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
        const res = await api.get('/your-entity/export', {
            params: { 
                format,
                // Add any filters here
                status: statusFilter
            },
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        const ext = format === 'excel' ? 'xlsx' : format;
        link.setAttribute('download', `your_entity_${new Date().toISOString().split('T')[0]}.${ext}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error('Export failed', error);
    }
};
```

### Step 4: Frontend - Add Button to UI

```tsx
<div className="page-header">
    <div>
        <h1 className="page-title">Your Page Title</h1>
        <p>Description</p>
    </div>
    <ExportButton onExport={handleExport} />
</div>
```

## Testing

### Test Each Export Format

1. **CSV Export**:
   - Click Export button
   - Select "CSV"
   - Verify file downloads
   - Open in Excel/Google Sheets
   - Check data integrity

2. **Excel Export**:
   - Click Export button
   - Select "Excel"
   - Verify `.xlsx` file downloads
   - Open in Excel
   - Check formatting (bold headers, column widths)

3. **PDF Export**:
   - Click Export button
   - Select "PDF"
   - Verify PDF downloads
   - Open and check:
     - Table formatting
     - Pagination
     - Headers on each page
     - Page numbers

### Test Filters

For pages with filters (Orders, Transactions, etc.):
1. Apply a filter (e.g., Status = "Delivered")
2. Export data
3. Verify exported data matches filtered view

## Dependencies

Make sure these packages are installed:

```json
{
  "json2csv": "^6.0.0",
  "exceljs": "^4.3.0",
  "pdfkit": "^0.13.0"
}
```

Install if missing:
```bash
cd backend
npm install json2csv exceljs pdfkit
```

## File Structure

```
backend/
├── controllers/
│   └── exportController.js          # All export functions
├── utils/
│   └── exportHelper.js               # Export utility class
└── routes/
    ├── orderRoutes.js                # Updated with export route
    ├── userRoutes.js                 # Updated with export route
    ├── transactionRoutes.js          # Updated with export route
    ├── requestRoutes.js              # Updated with export route
    ├── refundRoutes.js               # Updated with export route
    └── adminMasterRoutes.js          # Updated with export routes

frontend/
├── src/app/components/
│   └── ExportButton.tsx              # Reusable export button
└── src/app/admin/
    ├── orders/page.tsx               # Updated with export
    ├── users/page.tsx                # Updated with export
    └── transactions/page.tsx         # Updated with export
```

## Future Enhancements

1. **Import Functionality**:
   - CSV/Excel upload
   - Data validation
   - Bulk create/update

2. **Scheduled Exports**:
   - Daily/weekly automated exports
   - Email delivery

3. **Custom Column Selection**:
   - Let users choose which columns to export
   - Save export templates

4. **Advanced Filters**:
   - Date range exports
   - Multi-field filtering

5. **Export History**:
   - Track who exported what and when
   - Download previous exports

## Summary

✅ **Completed**:
- Export helper utility created
- Export controller with 8 entity types
- Routes updated for Orders, Users, Transactions, Requests, Refunds, Brands, HSN, Offers
- ExportButton component created
- Frontend updated for Orders, Users, Transactions pages
- All three formats supported (CSV, Excel, PDF)

🔄 **Remaining**:
- Add ExportButton to remaining admin pages (Requests, Refunds, Brands, HSN, Offers, Stock, Coupons, Banners, Special Deals, Logs)
- Create export functions for entities without them (Stock, Coupons, Banners, Special Deals, Logs)
- Test all export functionality
- Add import functionality (future)

## Usage Example

```typescript
// In any admin page with a table:

import ExportButton from "../../components/ExportButton";

const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
        const res = await api.get('/your-route/export', {
            params: { format },
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        const ext = format === 'excel' ? 'xlsx' : format;
        link.setAttribute('download', `filename_${new Date().toISOString().split('T')[0]}.${ext}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error('Export failed', error);
    }
};

// In JSX:
<ExportButton onExport={handleExport} />
```

---

**Last Updated**: 2026-02-12
**Status**: Core functionality complete, remaining pages need integration
