const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const generateSalesVoucherXML = (order, user, isCancellation = false) => {
  // 1. DATE LOGIC (Education Mode: Force 1st of Month)
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    // EDUCATION MODE: Always 1st of the month
    const day = '01';
    return `${year}${month}${day}`;
  };

  const voucherDate = formatDate(isCancellation ? (order.updatedAt || new Date()) : order.createdAt);

  // 2. LEDGER NAME LOGIC (Unique)
  let uniqueName = user.username;
  if (user.mobile) uniqueName = `${user.username} - ${user.mobile}`;
  const ledgerName = escapeXml(user.tallyLedgerName || uniqueName);

  // 3. STATE / GST LOGIC
  // Check address to determine Place of Supply
  const shippingAddress = JSON.stringify(order.shippingAddress || {}).toLowerCase();
  const isLocal = shippingAddress.includes('gujarat'); // Base State

  // NARRATION ENRICHMENT (Logistics Info)
  let narration = `Order ID: ${order._id} | ${isLocal ? 'Local Sale' : 'Interstate Sale'}`;
  if (!isCancellation && order.busDetails && order.busDetails.busNumber) {
    narration += ` | Bus: ${order.busDetails.busNumber}`;
    if (order.busDetails.driverContact) narration += ` (Driver: ${order.busDetails.driverContact})`;
  } else if (isCancellation) {
    narration += ` | (Cancellation/Return)`;
  }

  // 4. CALCULATION & ROUND OFF
  // Sum up actual item totals vs Ordered Grand Total
  let runningTotal = 0;

  let inventoryEntries = '';
  // For cancellation, only include items that ARE cancelled/returned
  const itemsToProcess = isCancellation
    ? order.items.filter(item => item.status === 'Cancelled' || item.status === 'Returned' || item.status === 'Refunded')
    : order.items;

  itemsToProcess.forEach(item => {
    // For partial quantity returned, use that. Otherwise use full quantity if whole item cancelled.
    const qty = (isCancellation && item.quantityReturned > 0) ? item.quantityReturned : item.quantity;
    const itemValue = item.priceAtBooking * qty;
    runningTotal += itemValue;

    const unit = item.product ? (item.product.unit || 'pcs') : 'pcs';

    // Construct Variation-Aware Item Name for Tally
    let itemNameComp = item.productTitle || (item.product ? item.product.title : 'Deleted-Product-' + item._id);
    if (item.modelName) {
      itemNameComp += ` (${item.modelName})`;
    }
    if (item.variationText) {
      itemNameComp += ` (${item.variationText})`;
    }
    const escapedItemName = escapeXml(itemNameComp);

    // Item XML
    inventoryEntries += `
          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>${escapedItemName}</STOCKITEMNAME>
            <ISDEEMEDPOSITIVE>${isCancellation ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
            <RATE>${item.priceAtBooking}/${unit}</RATE>
            <AMOUNT>${isCancellation ? "" : "-"}${itemValue}</AMOUNT>
            <ACTUALQTY>${qty} ${unit}</ACTUALQTY>
            <BILLEDQTY>${qty} ${unit}</BILLEDQTY>
             <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>Main Location</GODOWNNAME>
                <BATCHNAME>Primary Batch</BATCHNAME>
                <AMOUNT>${isCancellation ? "" : "-"}${itemValue}</AMOUNT>
                <ACTUALQTY>${qty} ${unit}</ACTUALQTY>
                <BILLEDQTY>${qty} ${unit}</BILLEDQTY>
             </BATCHALLOCATIONS.LIST>
             
             <!-- TAX ALLOCATION PER ITEM (Standard Tally Practice) -->
             <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>${isLocal ? 'Sales Account' : 'IGST Sales'}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${isCancellation ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
                <AMOUNT>${isCancellation ? "" : "-"}${itemValue}</AMOUNT>
             </ACCOUNTINGALLOCATIONS.LIST>
          </ALLINVENTORYENTRIES.LIST>`;
  });

  // Calculate Tax (Simulated for Tally Ledger Entries)
  // Note: Tally usually auto-calculates tax if configured, but we force values here to match Web App exactly.
  // Ideally, we sum up the tax from order items.
  const taxTotal = order.taxTotal || 0; // Ensure you have this field stored
  runningTotal += taxTotal;

  // Round Off Logic
  const roundOffRaw = order.totalAmount - runningTotal;
  const roundOff = Math.round(roundOffRaw * 100) / 100;

  // 5. VOUCHER XML CONSTRUCTION
  const voucherType = isCancellation ? "Credit Note" : "Sales";
  const action = "Create";

  const xml = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
           <VOUCHER VCHTYPE="${voucherType}" ACTION="${action}">
              <DATE>${voucherDate}</DATE>
              <GUID>${isCancellation ? 'CN-' : 'ORD-'}${order._id}</GUID>
              <NARRATION>${escapeXml(narration)}</NARRATION>
              <PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME>
              <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
              <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
              <ISINVOICE>Yes</ISINVOICE>
              
              <!-- IGNORE NEGATIVE STOCK ERRORS -->
              <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
              <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
              <VOUCHERNUMBER>${order.invoiceNumber || order._id}</VOUCHERNUMBER>
              
              <!-- SHIP TO / DISPATCH DETAILS (Consignee) -->
              <BASICBUYERNAME>${ledgerName}</BASICBUYERNAME>
              <BASICBUYERADDRESS.LIST>
                 ${(user.address || '').split(',').map(part => `<BASICBUYERADDRESS>${escapeXml(part.trim())}</BASICBUYERADDRESS>`).join('\n')}
              </BASICBUYERADDRESS.LIST>
              <!-- If Shipping Address differs, we can map it here. For now using same for consistency unless specific shipping address object exists -->
              
              <!-- Party Ledger (Debtor) -->
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>${ledgerName}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${isCancellation ? "No" : "Yes"}</ISDEEMEDPOSITIVE>
                <AMOUNT>${isCancellation ? "" : "-"}${isCancellation ? runningTotal : order.totalAmount}</AMOUNT>
                
                <!-- BILL WISE DETAILS (Auto-Settlement) -->
                <BILLALLOCATIONS.LIST>
                    <NAME>${order.invoiceNumber || order._id}</NAME>
                    <BILLTYPE>${isCancellation ? 'Agst Ref' : 'New Ref'}</BILLTYPE>
                    <AMOUNT>${isCancellation ? "" : "-"}${isCancellation ? runningTotal : order.totalAmount}</AMOUNT>
                </BILLALLOCATIONS.LIST>
              </LEDGERENTRIES.LIST>

              <!-- ITEM ENTRIES -->
              ${inventoryEntries}

              <!-- TAX LEDGERS -->
              <!-- CGST/SGST for Local, IGST for Interstate -->
              ${isLocal ? `
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>CGST</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${isCancellation ? "Yes" : "No"}</ISDEEMEDPOSITIVE> 
                <AMOUNT>${isCancellation ? "-" : ""}${taxTotal / 2}</AMOUNT>
              </LEDGERENTRIES.LIST>
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>SGST</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${isCancellation ? "Yes" : "No"}</ISDEEMEDPOSITIVE> 
                <AMOUNT>${isCancellation ? "-" : ""}${taxTotal / 2}</AMOUNT>
              </LEDGERENTRIES.LIST>
              ` : `
               <LEDGERENTRIES.LIST>
                <LEDGERNAME>IGST</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${isCancellation ? "Yes" : "No"}</ISDEEMEDPOSITIVE> 
                <AMOUNT>${isCancellation ? "-" : ""}${taxTotal}</AMOUNT>
              </LEDGERENTRIES.LIST>
              `}

              <!-- ROUND OFF LEDGER (Only if non-zero) -->
              ${roundOff !== 0 ? `
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>Round Off</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${roundOff > 0 ? (isCancellation ? "Yes" : "No") : (isCancellation ? "No" : "Yes")}</ISDEEMEDPOSITIVE>
                <AMOUNT>${Math.abs(roundOff)}</AMOUNT>
              </LEDGERENTRIES.LIST>
              ` : ''}

           </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  return xml;
};

module.exports = { generateSalesVoucherXML };
