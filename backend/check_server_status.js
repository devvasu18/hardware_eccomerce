const axios = require('axios');
axios.get('http://localhost:5000/api/test')
    .then(res => console.log('Server UP'))
    .catch(err => console.log('Server DOWN', err.message));
