const generateUnitXML = (unitName = 'pcs') => {
  return `<ENVELOPE>
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
           <UNIT NAME="${unitName}" ACTION="Create">
              <NAME>${unitName}</NAME>
              <ISSIMPLEUNIT>Yes</ISSIMPLEUNIT>
              <FORPAYROLL>No</FORPAYROLL>
              <DECIMALPLACES>2</DECIMALPLACES>
           </UNIT>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

module.exports = { generateUnitXML };
