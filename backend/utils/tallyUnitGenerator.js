const generateUnitXML = () => {
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
           <UNIT NAME="pcs" ACTION="Create">
              <NAME>pcs</NAME>
              <ISSIMPLEUNIT>Yes</ISSIMPLEUNIT>
              <FORPAYROLL>No</FORPAYROLL>
           </UNIT>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

module.exports = { generateUnitXML };
