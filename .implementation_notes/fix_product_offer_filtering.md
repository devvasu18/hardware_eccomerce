# Fix: Product Offer Filtering

## 🐛 Issue
Products linked to an offer were not showing up on the `/products?offer={slug}` page.

## 🔍 Root Cause
The **backend query was incorrect**.
In `backend/routes/productRoutes.js`, the code was querying for a singular `offer` field:
```javascript
query.offer = offerDoc._id;
```
However, the **Product model** uses a plural `offers` array to support multiple offers per product:
```javascript
offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }]
```
Because the `offer` field does not exist on the Product document, the query returned no results.

## ✅ Solution
Updated `backend/routes/productRoutes.js` to query the correct `offers` field:
```javascript
// Before
query.offer = offerDoc._id;

// After
query.offers = offerDoc._id;
```
Mongoose automatically handles querying an array field with a single value (it checks if the array *contains* that value).

## 🧪 Verification
1.  **Product Manager**: Offer linked to product (e.g. "Summer Sale").
2.  **Product Document**: `offers: [ObjectId("...")]`.
3.  **Frontend URL**: `/products?offer=summer-sale`.
4.  **Backend Query**: `Product.find({ offers: ObjectId("...") })`.
5.  **Result**: Product is found and returned.

The feature should now work correctly.
