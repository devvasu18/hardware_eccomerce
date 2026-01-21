const TaxCalculator = {
    // Configuration (Ideally from DB/Env)
    HOME_STATE: 'Gujarat',

    calculateItemTax: (basePrice, quantity, productState, hsn, taxRate) => {
        const taxableValue = basePrice * quantity;
        const isInterstate = productState.toLowerCase() !== TaxCalculator.HOME_STATE.toLowerCase();

        let cgst = 0, sgst = 0, igst = 0;

        if (isInterstate) {
            igst = (taxableValue * taxRate) / 100;
        } else {
            cgst = (taxableValue * (taxRate / 2)) / 100;
            sgst = (taxableValue * (taxRate / 2)) / 100;
        }

        const taxAmount = cgst + sgst + igst;
        const total = taxableValue + taxAmount;

        return {
            taxableValue,
            cgst,
            sgst,
            igst,
            taxAmount,
            total,
            isInterstate
        };
    },

    generateInvoiceNumber: async (OrderModel) => {
        // Format: INV-YYYY-SEQ (e.g., INV-2026-0001)
        const year = new Date().getFullYear();
        const startOfYear = new Date(year, 0, 1);

        const count = await OrderModel.countDocuments({
            createdAt: { $gte: startOfYear },
            status: { $ne: 'Cancelled' } // Don't skip numbers for cancellations ideally, but depends on compliance
        });

        const seq = (count + 1).toString().padStart(5, '0');
        return `INV-${year}-${seq}`;
    }
};

module.exports = TaxCalculator;
