const generateSalesVoucherXML = (order, user, isCancellation = false) => {
  // Format date as YYYYMMDD
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = '01'; // Education Mode Fix: Always use 1st of month
    return `${year}${month}${day}`;
  };

  const voucherDate = formatDate(order.createdAt);
  const ledgerName = user.tallyLedgerName || user.username;

  // Determine Voucher Type: Credit Note for Cancellation (Return), Sales for Normal
  const voucherType = isCancellation ? "Credit Note" : "Sales";
  const action = "Create"; // Always Create new voucher

  let inventoryEntries = '';
  order.items.forEach(item => {
    inventoryEntries += `
          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>${item.product.title}</STOCKITEMNAME>
            <ISDEEMEDPOSITIVE>${isCancellation ? "Yes" : "No"}</ISDEEMEDPOSITIVE> <!-- Reverse for CN -->
            <RATE>${item.priceAtBooking}/pcs</RATE>
            <AMOUNT>${isCancellation ? "" : "-"}${item.priceAtBooking * item.quantity}</AMOUNT> <!-- Positive for CN -->
            <ACTUALQTY>${item.quantity} pcs</ACTUALQTY>
            <BILLEDQTY>${item.quantity} pcs</BILLEDQTY>
             <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>Main Location</GODOWNNAME>
                <BATCHNAME>Primary Batch</BATCHNAME>
                <AMOUNT>${isCancellation ? "" : "-"}${item.priceAtBooking * item.quantity}</AMOUNT>
                <ACTUALQTY>${item.quantity} pcs</ACTUALQTY>
                <BILLEDQTY>${item.quantity} pcs</BILLEDQTY>
             </BATCHALLOCATIONS.LIST>
          </ALLINVENTORYENTRIES.LIST>`;
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
           <VOUCHER VCHTYPE="${voucherType}" ACTION="${action}">
              <DATE>${voucherDate}</DATE>
              <GUID>${isCancellation ? 'CN-' : 'ORD-'}${order._id}</GUID>
              <NARRATION>Order ID: ${order._id} ${isCancellation ? '(Cancellation Return)' : ''}</NARRATION>
              <PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME>
              <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
              <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
              <ISINVOICE>No</ISINVOICE>

              <!-- Party Ledger (Debtor) -->
              <LEDGERENTRIES.LIST>
                <LEDGERNAME>${ledgerName}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${isCancellation ? "No" : "Yes"}</ISDEEMEDPOSITIVE> <!-- Credit for CN -->
                <AMOUNT>${isCancellation ? "" : "-"}${order.totalAmount}</AMOUNT>
              </LEDGERENTRIES.LIST>

              <!-- Sales Account -->
               <LEDGERENTRIES.LIST>
                <LEDGERNAME>Sales Account</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${isCancellation ? "Yes" : "No"}</ISDEEMEDPOSITIVE> <!-- Debit for CN -->
                <AMOUNT>${isCancellation ? "-" : ""}${order.totalAmount}</AMOUNT>
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
