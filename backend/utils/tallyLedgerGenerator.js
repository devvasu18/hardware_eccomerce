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

const generateSalesLedgerXML = () => {
  return `
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
           <LEDGER NAME="Sales Account" ACTION="Create">
              <NAME.LIST>
                <NAME>Sales Account</NAME>
              </NAME.LIST>
              <PARENT>Sales Accounts</PARENT>
              <OPENINGBALANCE>0</OPENINGBALANCE>
              <ISBILLWISEON>No</ISBILLWISEON>
              <AFFECTSSTOCK>Yes</AFFECTSSTOCK>
              <ISGSTAPPLICABLE>Yes</ISGSTAPPLICABLE>
           </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

module.exports = { generateLedgerXML, generateSalesLedgerXML };
