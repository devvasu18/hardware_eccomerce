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

  // Common mappings
  if (lower.includes('gujarat')) return 'Gujarat';
  if (lower.includes('maharashtra')) return 'Maharashtra';
  if (lower.includes('rajasthan')) return 'Rajasthan';
  if (lower.includes('delhi')) return 'Delhi';
  if (lower.includes('karnataka')) return 'Karnataka';
  if (lower.includes('tamil')) return 'Tamil Nadu';
  if (lower.includes('uttar pradesh')) return 'Uttar Pradesh';
  if (lower.includes('madhya pradesh')) return 'Madhya Pradesh';
  // Add more as needed, fallback to Title Case simple
  return input.charAt(0).toUpperCase() + input.slice(1);
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

module.exports = { generateLedgerXML, generateSalesLedgerXML };
