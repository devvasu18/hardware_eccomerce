# Tally Integration System Documentation

## 1. Overview
The Tally Integration System automates the synchronization of **Sales (Orders)** and **Purchases (Stock Entries)** from the Hardware System Web Application to **Tally Prime**. It ensures that inventory, financial ledgers, and GST records remain consistent between the web platform and the accounting software.

## 2. Architecture & Workflow

The system follows a **Push-on-Event** model with a **Fallback Queue** for reliability.

### 2.1 Core Components
*   **Trigger Points**: events in Controllers (`OrderController`, `StockController`).
*   **Orchestrator**: `tallyService.js` manages the flow and dependency resolution.
*   **XML Generators**: Utility functions converting MongoDB documents to Tally-compliant XML.
*   **Queue System**: MongoDB-based queue (`TallySyncQueue`) for offline/retry handling.
*   **Health Check**: Background Cron Job (`tallyHealthCheckJob`) to retry failed/queued items.

### 2.2 Data Flow Diagram (Conceptual)
```mermaid
graph TD
    A[User Action] -->|Order Assigned to Bus| B(Order Controller)
    A -->|Stock Entry Created| C(Stock Controller)
    
    B --> D{Tally Online?}
    C --> D
    
    D -- Yes --> E[Send XML to Tally]
    D -- No/Fail --> F[Add to Sync Queue]
    
    F --> G[Background Cron Job]
    G -->|Tally Online| E
    
    E --> H[Update Status (Synced)]
```

---

## 3. synchronization Workflows

### 3.1 Sales Sync (Orders)
**Trigger**: When an Order status is updated to **"Assigned to Bus"**.
**Reverse Trigger**: When an Order is **Cancelled** (if previously synced, creating a Credit Note).

**Steps Performed in `syncOrderToTally(orderId)`:**
1.  **Units**: Syncs Units (e.g., "pcs") to ensure they exist.
2.  **Sales Ledger**: Syncs "Sales Account" (Under Sales Accounts).
3.  **Tax Ledgers**: Syncs CGST, SGST, IGST (Under Duties & Taxes) and Round Off.
4.  **Customer Ledger**: Creates/Updates the Party Ledger (Debtor).
    *   *Name Format*: `Username` or `Username - Mobile` (for uniqueness).
    *   *State Logic*: Auto-detects "Gujarat" (Intrastate) vs others (Interstate) based on address.
5.  **Stock Items**: Syncs all products in the order.
    *   *Naming*: `Product Title (Model Name) (Variant Name)`.
    *   *HSN/GST*: Uses Product's HSN and GST Rate.
6.  **Voucher**: Pushes the **Sales Voucher**.
    *   *Voucher Type*: "Sales".
    *   *Invoice No*: Matches Web App Invoice Number.

### 3.2 Purchase Sync (Stock Entries)
**Trigger**: When a **Stock Entry** is created via the Admin Panel.

**Steps Performed in `syncStockEntryToTally(entryId)`:**
1.  **Units**: Syncs Units.
2.  **Purchase Ledger**: Syncs "Purchase Account" (Under Purchase Accounts).
3.  **Tax Ledgers**: Syncs CGST, SGST, IGST.
4.  **Supplier Ledger**: Creates/Updates the Supplier Party Ledger (Creditor).
5.  **Stock Items**: Syncs items involved in the purchase.
6.  **Voucher**: Pushes the **Purchase Voucher**.
    *   *Voucher Type*: "Purchase".
    *   *Reference*: Supplier Invoice Number.

---

## 4. Code Structure

| Component | File Path | Responsibility |
| :--- | :--- | :--- |
| **Service** | `backend/services/tallyService.js` | Main logic, Health checks, Queue processing, Sync orchestration. |
| **Sales XML** | `backend/utils/tallyXmlGenerator.js` | Generates XML for Sales Vouchers. |
| **Purchase XML** | `backend/utils/tallyPurchaseXmlGenerator.js` | Generates XML for Purchase Vouchers. |
| **Ledger XML** | `backend/utils/tallyLedgerGenerator.js` | Generates XML for Customers, Suppliers, and Tax Ledgers. |
| **Item XML** | `backend/utils/tallyStockItemGenerator.js` | Generates XML for Stock Items (Products). |
| **Queue Model** | `backend/models/TallySyncQueue.js` | Schema for storing queued/failed instructions. |
| **Cron Job** | `backend/jobs/tallyHealthCheckJob.js` | Hourly job to process the queue. |
| **Routes** | `backend/routes/tallyRoutes.js` | API endpoints (Manual Sync, Admin Queue View). |

---

## 5. Queue & Error Handling

### 5.1 Offline Mode
If Tally is unreachable (Connection Refused / Timeout):
1.  The system catches the error in `syncWithHealthCheck`.
2.  The full XML payload is saved to `TallySyncQueue` with status `pending`.
3.  The Order/Stock Entry is marked as `queued` in the database.

### 5.2 Retries
*   **Immediate Retry**: If the initial request fails, it is added to the queue.
*   **Scheduled Retry**: The **Hourly Cron Job** attempts to process all `pending` items.
*   **Max Retries**: Items have a `retryCount`. After max retries (status `failed`), they require manual intervention via the Admin Panel.

### 5.3 Duplicate Prevention
*   **Tally Errors**: If Tally returns "Already Exists", the system treats it as a **Success** (ignoring the duplicate) to prevent infinite retry loops.

---

## 6. Configuration

**Environment Variables (.env)**
```env
TALLY_URL=http://localhost:9000/   # URL where Tally is running
TALLY_TIMEOUT=3000                 # Timeout in ms
```
*Note: Tally Prime must be running with ODBC/HTTP Server enabled on port 9000.*

---

## 7. Troubleshooting

*   **"Tally Server Not Reachable"**: 
    *   Ensure Tally Prime is open.
    *   Check F12 Configure > Connectivity > Client/Server configuration. Enable "Both" or "Server" on Port 9000.
*   **"Voucher Type Not Found"**:
    *   Ensure the Company loaded in Tally has default Voucher Types ("Sales", "Purchase", "Credit Note").
*   **"Stock Item Does Not Exist"**:
    *   The sync order attempts to create Items first. If that fails, the Voucher will fail. Check `TallySyncQueue` logs for the specific Item error.
