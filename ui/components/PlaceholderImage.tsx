import { Box } from "@chakra-ui/react";
import { getRandomPlaceholderColor } from "../../utils/ui-utils";

const PlaceholderImage = ({ title }: { title: string }) => {
  return (
    <Box
      py="30px"
      px="20px"
      fontSize="100px"
      textTransform="uppercase"
      bg={getRandomPlaceholderColor()}
      color="white"
    >
      {/* @ts-ignore */}
      <marquee>{title}</marquee>
    </Box>
  );
};

export default PlaceholderImage;
