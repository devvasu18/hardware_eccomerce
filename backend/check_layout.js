
const axios = require('axios');

async function checkLayout() {
    try {
        const res = await axios.get('http://localhost:5000/api/home-layout?page=home');
        console.log("Layout Items:", JSON.stringify(res.data, null, 2));

        const featured = res.data.find(item => item.componentType === 'FEATURED_PRODUCTS');
        if (featured) {
            console.log("FEATURED_PRODUCTS found:", featured);
        } else {
            console.log("FEATURED_PRODUCTS NOT FOUND in layout!");
        }

    } catch (err) {
        console.error(err);
    }
}
checkLayout();
