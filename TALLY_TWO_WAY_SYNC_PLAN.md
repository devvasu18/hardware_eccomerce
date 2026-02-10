# Tally Two-Way Synchronization Analysis & Plan

## 1. Executive Summary
**Is it possible?** **Yes.**
You can implement a two-way synchronization where:
1.  **Web -> Tally (Current)**: Orders and Stock Entries created in the the Web App are pushed to Tally.
2.  **Tally -> Web (New)**: Sales, Purchases, and Stock adjustments made directly in Tally are pulled into the Web App to update inventory and financial records.

## 2. Recommended Approach: Periodic Polling (The "Pull" Method)

We recommend using a **Polling Strategy** via the existing Node.js backend.
*   **Why?** It does not require learning TDL (Tally Definition Language) or modifying the Tally software installation. It uses the standard HTTP interface you are already using.
*   **How?** A Cron Job runs every X minutes (e.g., 5 mins) and asks Tally: *"Give me all vouchers modified since [Last Sync Time]"*.

---

## 3. Implementation Strategy

### 3.1 New Core Components
To enable two-way sync, we need to add the following components to your backend:

1.  **`TallyPullService`**: A service dedicated to fetching data from Tally.
2.  **`LastSyncLog`**: A database model to track the last time we successfully pulled data, to avoid re-fetching historical data.
3.  **Parsers**: Robust XML parsers (using `xml2js`) to convert Tally's complex XML response into MongoDB updates.

### 3.2 Workflow: Fetching Updates from Tally

#### Step 1: The Request (Export XML)
We send an XML request to Tally to export specific collections (Vouchers) with a filter.

**Endpoint**: `POST http://localhost:9000`

**Payload (Conceptual):**
```xml
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVFROMDATE>20231001</SVFROMDATE> <!-- Dynamic: Last Sync Date -->
        <SVTODATE>20231027</SVTODATE>   <!-- Dynamic: Today -->
      </STATICVARIABLES>
    </DESC>
    <REPORTNAME>Vouchers</REPORTNAME> <!-- Or 'List of Accounts' for masters -->
  </BODY>
</ENVELOPE>
```

#### Step 2: Processing the Response
Tally returns a large XML string containing `<VOUCHER>` tags. We parse this to handle:
1.  **Sales Vouchers**:
    *   Find the `Order` in MongoDB (by Order No/Reference) and update status.
    *   OR ensure stock is deducted if it was a direct sale in Tally (Walk-in customer).
2.  **Purchase Vouchers**:
    *   Create a `StockEntry` in MongoDB to increase inventory.
3.  **Stock Journals**:
    *   Handle adjustments (waste, theft, corrections).

### 3.3 Data Mapping Challenges & Solutions

| Data Point | Tally Source | MongoDB Target | Challenge | Solution |
| :--- | :--- | :--- | :--- | :--- |
| **Product** | `<STOCKITEMNAME>` | `Product.title` | Strings might not match exactly. | Use a strict alias system or ensure Tally Item Name = MongoDB Product ID/Code. |
| **Customer** | `<PARTYLEDGERNAME>` | `User.username` | Tally allows duplicates/loose names. | Use Mobile Number in Tally Ledger Name (e.g., "John Doe - 9876543210") to match Users. |
| **Inventory** | `Effective Quantity` | `ProductStock` | Calculation differences. | **Treat Tally as the Source of Truth** for available stock quantity. |

---

## 4. Alternative: Real-Time Webhooks (The "Push" Method)

*Note: This is more complex and requires Tally customization.*

You can write a **TDL (Tally Definition Language)** file that triggers an HTTP POST to your server whenever a voucher is accepted (Saved).

**Concept TDL Snippet:**
```tally
[System: Formula]
  PostToWeb: Call HTTP : "POST" : "http://your-server.com/api/tally/webhook" : "JSON" : $$CurrentVoucherAsJSON
```

**Pros**: Real-time updates.
**Cons**:
*   Requires valid Tally Developer configuration.
*   Harder to debug (Silent failures in Tally).
*   Must be installed on every Tally machine.

**Verdict**: Stick to **Polling (Option A)** for now. It's safer and fully controllable from your Node.js code.

---

## 5. Next Steps

To upgrade to Two-Way Sync:

1.  **Masters Sync**: Create a script to fetch all `Stock Items` from Tally and map them to MongoDB Products (using `xml2js`).
2.  **Inventory Sync**: Create a job to fetch "Closing Balance" of all items from Tally and update `products.stock` in MongoDB.
    *   *This acts as a "Reset" to ensure both systems match.*
3.  **Voucher Sync**: Implement the `fetchModifiedVouchers` function in `tallyService.js`.
