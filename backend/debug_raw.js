const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function checkRaw() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    const collection = db.collection('products');

    // Using the ID from the previous run
    const product = await collection.findOne({ _id: new ObjectId('6992ab135d7cf49e4274b510') });

    if (product) {
        console.log('Product Found Raw:', product._id);
        console.log('Title:', JSON.stringify(product.title));
        console.log('Keywords:', JSON.stringify(product.keywords));
        console.log('Specifications:', JSON.stringify(product.specifications));
        console.log('Variations:', JSON.stringify(product.variations));
        console.log('Keywords Type:', typeof product.keywords);
        console.log('Is Keywords Array?', Array.isArray(product.keywords));
    } else {
        console.log('Product Not Found by ID');
    }
    await client.close();
}

checkRaw();
