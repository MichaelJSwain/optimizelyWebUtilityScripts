const getTrafficAllocationPerVariant = (totalTrafficAllocation, variants) => {
    const splitPerVariant = Math.trunc(totalTrafficAllocation / variants.length);
    let remainder;
    if (splitPerVariant * variants.length == totalTrafficAllocation) {
        remainder = false;
    } else {
        remainder = totalTrafficAllocation - (splitPerVariant * (variants.length - 1));
    }

    const variantsWithTrafficAllocation = variants.map((variant, idx) => {
        return {
            ...variant,
            trafficAllocation: !remainder || idx != (variants.length - 1) ? splitPerVariant : remainder
        }
    });
    return variantsWithTrafficAllocation;
};
