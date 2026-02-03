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

  let inventoryEntries = '';
  order.items.forEach(item => {
    inventoryEntries += `
          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>${item.product.title}</STOCKITEMNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <RATE>${item.priceAtBooking}/pcs</RATE>
            <AMOUNT>-${item.priceAtBooking * item.quantity}</AMOUNT>
            <ACTUALQTY>${item.quantity} pcs</ACTUALQTY>
            <BILLEDQTY>${item.quantity} pcs</BILLEDQTY>
             <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>Main Location</GODOWNNAME>
                <BATCHNAME>Primary Batch</BATCHNAME>
                <AMOUNT>-${item.priceAtBooking * item.quantity}</AMOUNT>
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
           <VOUCHER VCHTYPE="Sales" ACTION="Create">
              <DATE>${voucherDate}</DATE>
              <GUID>${order._id}</GUID>
              <NARRATION>Order ID: ${order._id}</NARRATION>
              <PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME>
              <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
              <EFFECTIVEDATE>${voucherDate}</EFFECTIVEDATE>
              <ISINVOICE>Yes</ISINVOICE>

              <LEDGERENTRIES.LIST>
                <LEDGERNAME>${ledgerName}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>-${order.totalAmount}</AMOUNT>
              </LEDGERENTRIES.LIST>

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
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
       <COMPANY>
          <REMOTECMPINFO.LIST MERGE="Yes">
             <NAME>0d276b2c-6232-4753-9029-760778401309</NAME>
             <REMOTECMPNAME>Maa Chamunda Motors</REMOTECMPNAME>
             <REMOTECMPSTATE>Rajasthan</REMOTECMPSTATE>
          </REMOTECMPINFO.LIST>
       </COMPANY>
    </TALLYMESSAGE>
  </BODY>
</ENVELOPE>`;

  return xml;
};

module.exports = { generateSalesVoucherXML };
