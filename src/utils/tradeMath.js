// Pure profit helpers — moved out of App.jsx unchanged.

// Always derive profit from exitPrice when available — stored profit can be stale/zero
export const getEffectiveProfit = (t) => {
    if (t.exitPrice != null && t.exitPrice !== undefined) {
        const totalFees = t.fees || 0;
        const partialExits = t.partialExits || [];
        // Partial exits already deduct a proportional share of fees each.
        // Only deduct the remaining unallocated portion here to avoid double-counting.
        const allocatedFees = partialExits.length > 0
            ? partialExits.reduce((s, pe) => {
                const origQty = t.originalQty || (t.qty + partialExits.reduce((sum, p) => sum + (p.qty || 0), 0));
                return s + ((pe.qty || 0) / origQty) * totalFees;
              }, 0)
            : 0;
        const remainingFees = Math.max(0, totalFees - allocatedFees);
        return (t.direction === 'short'
            ? (t.entryPrice - t.exitPrice) * t.qty
            : (t.exitPrice - t.entryPrice) * t.qty) - remainingFees;
    }
    return t.profit || 0;
};

// Total profit including all partial exits — used for win/loss classification
// so a trade is judged on its complete outcome, not just the final remaining qty
export const getTotalProfit = (t) => {
    const partialProfit = (t.partialExits && t.partialExits.length > 0)
        ? t.partialExits.reduce((s, pe) => s + (pe.profit || 0), 0)
        : 0;
    return getEffectiveProfit(t) + partialProfit;
};
