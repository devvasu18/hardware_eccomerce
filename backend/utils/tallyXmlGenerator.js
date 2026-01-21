const generateSalesVoucherXML = (order, user) => {
    // Format date as YYYYMMDD
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    const voucherDate = formatDate(order.createdAt);
    const ledgerName = user.tallyLedgerName || user.username;

    // Items XML
    let inventoryEntries = '';
    order.items.forEach(item => {
        inventoryEntries += `
      <ALLINVENTORYENTRIES.LIST>
        <STOCKITEMNAME>${item.product.name}</STOCKITEMNAME>
        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
        <RATE>${item.priceAtBooking}/pcs</RATE>
        <AMOUNT>-${item.priceAtBooking * item.quantity}</AMOUNT>
        <ACTUALQTY>${item.quantity} pcs</ACTUALQTY>
        <BILLEDQTY>${item.quantity} pcs</BILLEDQTY>
      </ALLINVENTORYENTRIES.LIST>
    `;
    });

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
           <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
              <DATE>${voucherDate}</DATE>
              <NARRATION>Order ID: ${order._id}</NARRATION>
              <PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME>
              <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
              <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
              <ISINVOICE>Yes</ISINVOICE>
              
              <!-- Ledger Entry for Party (Debit) -->
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>${ledgerName}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>-${order.totalAmount}</AMOUNT>
              </LEDGERENTRIES.LIST>

              <!-- Default Sales Ledger (Credit) -->
               <LEDGERENTRIES.LIST>
                <LEDGERNAME>Sales Account</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>${order.totalAmount}</AMOUNT>
              </LEDGERENTRIES.LIST>

              ${inventoryEntries}

           </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    return xml;
};

module.exports = { generateSalesVoucherXML };
