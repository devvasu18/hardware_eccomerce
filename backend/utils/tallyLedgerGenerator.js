const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Helper to map loose state names to Tally Standard State Names
const getStateName = (input) => {
  if (!input) return 'Gujarat'; // Default for local business
  const lower = input.toLowerCase();

  const states = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
    'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  for (const state of states) {
    if (lower.includes(state.toLowerCase())) return state;
  }

  // Fallback: Check for common abbreviations or variations if needed
  if (lower.includes('bangalore') || lower.includes('bengaluru')) return 'Karnataka';
  if (lower.includes('mumbai') || lower.includes('pune')) return 'Maharashtra';
  if (lower.includes('chennai')) return 'Tamil Nadu';
  if (lower.includes('kolkata')) return 'West Bengal';
  if (lower.includes('surat') || lower.includes('ahmedabad') || lower.includes('vadodara') || lower.includes('rajkot')) return 'Gujarat';

  return 'Gujarat'; // Ultimate fallback
};

const generateLedgerXML = (user) => {
  // Append mobile to ensure uniqueness, e.g. "Rahul - 9876543210"
  let uniqueName = user.username;
  if (user.mobile) {
    uniqueName = `${user.username} - ${user.mobile}`;
  }
  const ledgerName = escapeXml(user.tallyLedgerName || uniqueName);

  // GST Logic
  const hasGst = !!user.gstIn;
  const gstRegistrationType = hasGst ? 'Regular' : 'Consumer';

  // Extract State from address string or user field (Assuming user.state or parsing address)
  // For now, simple check in address string as fallback
  const estimatedState = user.state || (user.address && (user.address.toLowerCase().includes('maharashtra') ? 'Maharashtra' : 'Gujarat')) || 'Gujarat';
  const tallyState = getStateName(estimatedState);

  // Defaulting to Sundry Debtors for customers, but allow override (e.g. Sundry Creditors for Suppliers)
  const parentGroup = user.tallyParentGroup || "Sundry Debtors";

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
                ${(user.address || '').split(',').map(part => `<ADDRESS>${escapeXml(part.trim())}</ADDRESS>`).join('\n')}
              </ADDRESS.LIST>
              <MAILINGNAME.LIST>
                <MAILINGNAME>${ledgerName}</MAILINGNAME>
              </MAILINGNAME.LIST>
              
              <!-- NEW: GST & STATE INFO -->
              <STATENAME>${tallyState}</STATENAME>
              <COUNTRYNAME>India</COUNTRYNAME>
              <GSTREGISTRATIONTYPE>${gstRegistrationType}</GSTREGISTRATIONTYPE>
              ${hasGst ? `<PARTYGSTIN>${user.gstIn}</PARTYGSTIN>` : ''}
              
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

const generatePurchaseLedgerXML = () => {
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
               <LEDGER NAME="Purchase Account" ACTION="Create">
                  <NAME.LIST>
                    <NAME>Purchase Account</NAME>
                  </NAME.LIST>
                  <PARENT>Purchase Accounts</PARENT>
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

const generateTaxLedgerXML = (ledgerName, parentGroup = "Duties & Taxes") => {
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
             <LEDGER NAME="${ledgerName}" ACTION="Create">
                <NAME.LIST>
                  <NAME>${ledgerName}</NAME>
                </NAME.LIST>
                <PARENT>${escapeXml(parentGroup)}</PARENT>
                <OPENINGBALANCE>0</OPENINGBALANCE>
                <ISBILLWISEON>No</ISBILLWISEON>
                <AFFECTSSTOCK>No</AFFECTSSTOCK>
             </LEDGER>
          </TALLYMESSAGE>
        </REQUESTDATA>
      </IMPORTDATA>
    </BODY>
  </ENVELOPE>`;
};

module.exports = { generateLedgerXML, generateSalesLedgerXML, generateTaxLedgerXML, generatePurchaseLedgerXML };
