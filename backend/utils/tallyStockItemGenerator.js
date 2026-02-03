/**
 * Generate Stock Item Master XML for Tally
 */
const generateStockItemXML = (product) => {
    // Tally uses 'title' from our standardized product schema
    const itemName = product.title || 'Unknown Item';
    const sellingPrice = parseFloat(product.price || product.mrp || 0);
    // Use HSN code if populated, else default or simple string
    const hsnCode = (product.hsn_code && product.hsn_code.code) ? product.hsn_code.code : '8703';

    // GST Calculation (Assuming standard 18% or product specific)
    const gstRate = product.gst_rate || 18;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    const igstRate = gstRate;

    const xml = `<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>All Masters</REPORTNAME>
   </REQUESTDESC>
   <REQUESTDATA>
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
     <STOCKITEM NAME="${itemName}" ACTION="Create"> 
      <NAME>${itemName}</NAME>
      <PARENT>Primary</PARENT>
      <BASEUNITS>pcs</BASEUNITS>
      <OPENINGBALANCE>0</OPENINGBALANCE>
      <ISGSTAPPLICABLE>Yes</ISGSTAPPLICABLE>
      <GSTTYPEOFSUPPLY>Goods</GSTTYPEOFSUPPLY>
      
      <!-- Basic GST Details -->
      <GSTDETAILS.LIST>
       <APPLICABLEFROM>20250401</APPLICABLEFROM>
       <HSNMASTERNAME>${hsnCode}</HSNMASTERNAME>
       <TAXABILITY>Taxable</TAXABILITY>
       <STATEWISEDETAILS.LIST>
        <STATENAME>Any</STATENAME>
        <RATEDETAILS.LIST>
         <GSTRATEDUTYHEAD>Integrated Tax</GSTRATEDUTYHEAD>
         <GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE>
         <GSTRATE>${igstRate}</GSTRATE>
        </RATEDETAILS.LIST>
       </STATEWISEDETAILS.LIST>
      </GSTDETAILS.LIST>

     </STOCKITEM>
    </TALLYMESSAGE>
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;

    return xml;
};

module.exports = { generateStockItemXML };
