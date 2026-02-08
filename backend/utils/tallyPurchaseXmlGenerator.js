const escapeXml = (unsafe) => {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

const generatePurchaseVoucherXML = (stockEntry, party) => {
    // 1. DATE LOGIC
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        // EDUCATION MODE: Always 1st of the month
        const day = '01';
        return `${year}${month}${day}`;
    };

    const voucherDate = formatDate(stockEntry.bill_date || new Date());

    // 2. LEDGER NAME LOGIC (Party)
    // Ensure we match the name used in generateLedgerXML for Party (or create if needed)
    let uniqueName = party.name;
    if (party.phone_no) uniqueName = `${party.name} - ${party.phone_no}`;
    const ledgerName = escapeXml(uniqueName);

    // 3. NARRATION
    let narration = `Purchase Invoice: ${stockEntry.invoice_no}`;

    // 4. ITEM ENTRIES
    let inventoryEntries = '';
    // We need the items. They are in ProductStock collection usually, but createStockEntry calls this immediately 
    // so we might pass them in memory.
    // Assuming 'stockEntry.items' is populated with [{ product, model, variant, qty, unit_price, total }]

    let runningTotal = 0;

    if (stockEntry.items && stockEntry.items.length > 0) {
        stockEntry.items.forEach(item => {
            const itemValue = item.qty * item.unit_price;
            runningTotal += itemValue;

            // Construct Item Name
            let itemNameComp = item.product_name || (item.product ? item.product.title : 'Unknown Item');
            // If detailed names are passed
            if (item.model_name) itemNameComp += ` (${item.model_name})`;
            if (item.variant_name) itemNameComp += ` (${item.variant_name})`;

            const escapedItemName = escapeXml(itemNameComp);
            const unit = 'pcs';

            inventoryEntries += `
          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>${escapedItemName}</STOCKITEMNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <RATE>${item.unit_price}/${unit}</RATE>
            <AMOUNT>-${itemValue}</AMOUNT>
            <ACTUALQTY>${item.qty} ${unit}</ACTUALQTY>
            <BILLEDQTY>${item.qty} ${unit}</BILLEDQTY>
             <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>Main Location</GODOWNNAME>
                <BATCHNAME>Primary Batch</BATCHNAME>
                <AMOUNT>-${itemValue}</AMOUNT>
                <ACTUALQTY>${item.qty} ${unit}</ACTUALQTY>
                <BILLEDQTY>${item.qty} ${unit}</BILLEDQTY>
             </BATCHALLOCATIONS.LIST>
             
             <!-- PURCHASE ACCOUNT ALLOCATION -->
             <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>Purchase Account</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>-${itemValue}</AMOUNT>
             </ACCOUNTINGALLOCATIONS.LIST>
          </ALLINVENTORYENTRIES.LIST>`;
        });
    }

    // 5. TAX
    const taxTotal = (stockEntry.cgst || 0) + (stockEntry.sgst || 0);

    // 6. XML
    const voucherType = "Purchase";
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
              <GUID>PUR-${stockEntry._id}</GUID>
              <NARRATION>${escapeXml(narration)}</NARRATION>
              <PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME>
              <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
              <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
              <ISINVOICE>Yes</ISINVOICE>
              <REFERENCE>${stockEntry.invoice_no}</REFERENCE>
              
              <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
              <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
              <VOUCHERNUMBER>${stockEntry.invoice_no}</VOUCHERNUMBER>
              
              <!-- Party Ledger (Creditor) -->
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>${ledgerName}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>${stockEntry.final_bill_amount}</AMOUNT>
                
                <BILLALLOCATIONS.LIST>
                    <NAME>${stockEntry.invoice_no}</NAME>
                    <BILLTYPE>New Ref</BILLTYPE>
                    <AMOUNT>${stockEntry.final_bill_amount}</AMOUNT>
                </BILLALLOCATIONS.LIST>
              </LEDGERENTRIES.LIST>

              <!-- ITEM ENTRIES -->
              ${inventoryEntries}

              <!-- TAX LEDGERS -->
              ${stockEntry.cgst > 0 ? `
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>CGST</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE> 
                <AMOUNT>-${stockEntry.cgst}</AMOUNT>
              </LEDGERENTRIES.LIST>
              ` : ''}
              
              ${stockEntry.sgst > 0 ? `
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>SGST</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE> 
                <AMOUNT>-${stockEntry.sgst}</AMOUNT>
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

module.exports = { generatePurchaseVoucherXML };
