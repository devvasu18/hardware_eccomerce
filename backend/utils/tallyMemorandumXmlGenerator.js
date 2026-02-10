function formatDate(date) {
    // YYYYMMDD
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Generates XML for a "Memorandum" Voucher to track On-Demand Requests without affecting Accounts/Inventory immediately.
 * 
 * @param {Object} request - The ProcurementRequest object
 * @param {Object} product - The Product object
 */
function generateMemorandumVoucherXML(request, product) {
    const voucherDate = formatDate(request.createdAt || new Date());
    const voucherNo = `REQ-${request._id.toString().slice(-6).toUpperCase()}`;

    // Determine Party Name: Default to "Cash" or Guest unless user exists
    // Ideally, we create a Ledger for the user if known, but for inquiries, we might use a generic "On Demand Inquiries" ledger
    // For now, let's use the customer name or "On Demand Customer"
    const partyName = request.customerContact?.name
        ? `${request.customerContact.name} - ${request.customerContact.mobile}`
        : `Guest Request - ${request.customerContact?.mobile}`;

    // Item Name
    let itemName = product.title;
    if (request.modelName) itemName += ` (${request.modelName})`;
    if (request.variationText) itemName += ` (${request.variationText})`;
    // Sanitize
    itemName = itemName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    /*
      Voucher Type: "Memorandum" is a standard Tally voucher type for non-accounting entries.
      Note: Memorandum vouchers do NOT affect stock reports unless configured otherwise. 
      They are perfect for "Requests".
    */

    return `
<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>Vouchers</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>$$SysName:Company</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Memorandum" ACTION="Create" OBJVIEW="Invoice Voucher View">
                        <DATE>${voucherDate}</DATE>
                        <VOUCHERTYPENAME>Memorandum</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${voucherNo}</VOUCHERNUMBER>
                        <REFERENCE>${request._id}</REFERENCE>
                        <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
                        <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
                        <ISINVOICE>Yes</ISINVOICE>
                        
                        <ALLINVENTORYENTRIES.LIST>
                            <STOCKITEMNAME>${itemName}</STOCKITEMNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <RATE>${request.declaredBasePrice || 0}/pcs</RATE>
                            <AMOUNT>-${(request.declaredBasePrice || 0) * request.requestedQuantity}</AMOUNT>
                            <ACTUALQTY> ${request.requestedQuantity} pcs</ACTUALQTY>
                            <BILLEDQTY> ${request.requestedQuantity} pcs</BILLEDQTY>
                            
                            <ACCOUNTINGALLOCATIONS.LIST>
                                <LEDGERNAME>Sales Accounts</LEDGERNAME> <!-- Dummy allocation required by Tally sometimes -->
                                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                <AMOUNT>-${(request.declaredBasePrice || 0) * request.requestedQuantity}</AMOUNT>
                            </ACCOUNTINGALLOCATIONS.LIST>
                        </ALLINVENTORYENTRIES.LIST>

                        <LEDGERENTRIES.LIST>
                            <LEDGERNAME>${partyName}</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>-${(request.declaredBasePrice || 0) * request.requestedQuantity}</AMOUNT>
                        </LEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
}

module.exports = { generateMemorandumVoucherXML };
