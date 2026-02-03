const axios = require('axios');

const TALLY_URL = 'http://localhost:9000';

async function testConnection() {
    console.log(`Testing connection to Tally at ${TALLY_URL}...`);
    try {
        const testXML = '<ENVELOPE><HEADER><TALLYREQUEST>Export</TALLYREQUEST></HEADER><BODY><DESC><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></DESC></BODY></ENVELOPE>';

        const response = await axios.post(TALLY_URL, testXML, {
            headers: { 'Content-Type': 'text/xml' },
            timeout: 5000
        });

        console.log('✅ Connection Successful!');
        console.log('Status:', response.status);
        console.log('Data Preview:', response.data.substring(0, 100));
    } catch (error) {
        console.log('❌ Connection Failed');
        if (error.code === 'ECONNREFUSED') {
            console.log('Reason: Connection connect ECONNREFUSED 127.0.0.1:9000');
            console.log('This means Tally is NOT listening on port 9000.');
            console.log('Please check F1: Help > Settings > Connectivity > Client/Server configuration.');
        } else {
            console.log('Error:', error.message);
        }
    }
}

testConnection();
