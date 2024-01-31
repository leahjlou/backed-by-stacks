export const formatStacksAmount = (amountInStacks: number): string => {
  return amountInStacks.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

/**
 * microToStacks
 *
 * @param {Number} amountInMicroStacks - the amount of microStacks to convert
 * @param {Number} localString - big pretty print if true
 */
export const ustxToStx = (
  amountInMicroStacks: string | number,
  localString = false
): number | string => {
  const value = Number(Number(amountInMicroStacks) / 10 ** 6);
  if (localString) {
    return formatStacksAmount(value);
  }
  return value;
};

export const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * @param stxAmount - the amount of stacks (or microstacks) to convert to a USD price
 * @param stxPrice - the current USD price of STX
 * @param isInMicroStacks - if true, the stxAmount is in microstacks
 *
 * @returns string - the formatted current USD price of the given STX
 */
export const getUsdValue = (
  stxAmount: number,
  stxPrice: number,
  isInMicroStacks = false
): string => {
  const amountInStx = isInMicroStacks
    ? (ustxToStx(stxAmount) as number)
    : stxAmount;
  const price = amountInStx * stxPrice;
  return price > 0 && price < 0.01 ? "<$0.01" : usdFormatter.format(price);
};
