const generateLedgerXML = (user) => {
    const ledgerName = user.tallyLedgerName || user.username;
    // Defaulting to Sundry Debtors for customers
    const parentGroup = "Sundry Debtors";

    const xml = `
<ENVELOPE>
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
           <LEDGER NAME="${ledgerName}" ACTION="Create">
              <NAME.LIST>
                <NAME>${ledgerName}</NAME>
              </NAME.LIST>
              <PARENT>${parentGroup}</PARENT>
              <OPENINGBALANCE>0</OPENINGBALANCE>
              <ISBILLWISEON>Yes</ISBILLWISEON>
              <AFFECTSSTOCK>No</AFFECTSSTOCK>
              <ADDRESS.LIST>
                <ADDRESS>${user.address || ''}</ADDRESS>
              </ADDRESS.LIST>
              <MAILINGNAME.LIST>
                <MAILINGNAME>${ledgerName}</MAILINGNAME>
              </MAILINGNAME.LIST>
           </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    return xml;
};

module.exports = { generateLedgerXML };
