import { Box } from "@chakra-ui/react";
import { ReactNode } from "react";

const PageContainer = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return (
    <Box maxW="1200px" mx="auto" p="6">
      {children}
    </Box>
  );
};

export default PageContainer;
