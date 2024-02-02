const placeholderColors = [
  "green.600",
  "orange.600",
  "purple.600",
  "gray.600",
  "yellow.600",
  "teal.600",
  "pink.600",
];

export const getRandomPlaceholderColor = () => {
  const i = Math.floor(Math.random() * placeholderColors.length);
  return placeholderColors[i];
};
