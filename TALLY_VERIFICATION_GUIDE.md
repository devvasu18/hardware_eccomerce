# How to Verify Data in Tally Prime

Since you successfully synced the data, here is how you find it in Tally Prime.

## Step 1: Check the "Day Book" (Sales Voucher)
This is the main place where daily transactions (Vouchers) are stored.

1.  On the **Gateway of Tally** (your main screen), look under the **TRANSACTIONS** section.
2.  Select **Day Book** and press **Enter**.
    *   *Note: By default, this might only look at the "Current Date" (1-Dec-2025 in your screenshot).*
3.  **Crucial Step:** Press **F2 (Period)** (or click the arrow next to F2 on the right bar and select `Period`).
    *   Set **From**: `1-Apr-2025`
    *   Set **To**: `31-Mar-2026`
    *   Press Enter.
4.  You should now see a **Sales** voucher listed for **Rahul Customer** with the amount **₹1050**.
5.  Press **Enter** on that line to open the full invoice. You will see "Engine Oil Filter" listed inside.

---

## Step 2: Check the "Stock Summary" (Items)
This verifies that the Item Master was created correctly.

1.  Go back to **Gateway of Tally** (Press `Esc`).
2.  Select **Stock Summary** under the **REPORTS** section.
3.  You should see **Engine Oil Filter** listed there with a quantity of **2 pcs**.

---

## Step 3: Check Ledgers (Customer Name)
This verifies that the Customer Account was created.

1.  Go back to **Gateway of Tally**.
2.  Select **Chart of Accounts** under **MASTERS**.
3.  Select **Ledgers**.
4.  Select **Sundry Debtors**.
5.  You will see **Rahul Customer** listed here.

---

### Troubleshooting
*   **"I don't see it!"**: 99% of the time, this is because of the **Date**. Press **F2** in the Day Book and clear the dates (make them blank) to see ALL entries regardless of date.
