// Script to track which admin pages still need dynamic config

const configuredPages = [
    '/admin/page.tsx',
    '/admin/analytics/intelligence/page.tsx',
    '/admin/banners/add/page.tsx',
    '/admin/banners/page.tsx',
    '/admin/banners/[id]/edit/page.tsx',
    '/admin/categories/page.tsx',
    '/admin/coupons/page.tsx',
    '/admin/coupons/add/page.tsx',
    '/admin/coupons/[id]/edit/page.tsx',
    '/admin/home-builder/page.tsx',
    '/admin/products/page.tsx',
];

const remainingPages = [
    '/admin/products/add/page.tsx',
    '/admin/products/[id]/edit/page.tsx',
    '/admin/orders/page.tsx',
    '/admin/orders/[id]/page.tsx',
    '/admin/users/page.tsx',
    '/admin/users/add/page.tsx',
    '/admin/users/[id]/edit/page.tsx',
    '/admin/users/[id]/view/page.tsx',
    '/admin/masters/brands/page.tsx',
    '/admin/masters/hsn/page.tsx',
    '/admin/masters/offers/page.tsx',
    '/admin/masters/parties/page.tsx',
    '/admin/masters/sub-categories/page.tsx',
    '/admin/settings/system/page.tsx',
    '/admin/settings/whatsapp/page.tsx',
    '/admin/settings/email-monitoring/page.tsx',
    '/admin/settings/whatsapp-monitoring/page.tsx',
    '/admin/stock/page.tsx',
    '/admin/stock/add/page.tsx',
    '/admin/tally/page.tsx',
    '/admin/transactions/page.tsx',
    '/admin/requests/page.tsx',
    '/admin/returns/page.tsx',
    '/admin/special-deals/page.tsx',
    '/admin/pages/page.tsx',
    '/admin/page-builder/[slug]/page.tsx',
    '/admin/page-builder/[slug]/preview/page.tsx',
    '/admin/home-builder/preview/page.tsx',
    '/admin/logs/page.tsx',
];

console.log(`✅ Configured: ${configuredPages.length} pages`);
console.log(`⏳ Remaining: ${remainingPages.length} pages`);
console.log(`📊 Total: ${configuredPages.length + remainingPages.length} pages`);
