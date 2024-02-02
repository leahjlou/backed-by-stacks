import { useContext, useEffect, useState } from "react";
import { Box, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import axios from "axios";
import { Campaign } from "../../app/models";
import Link from "next/link";
import WalletContext from "../context/WalletContext";
import PlaceholderImage from "../components/PlaceholderImage";

const CampaignsList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const { isWalletConnected } = useContext(WalletContext);

  useEffect(() => {
    const getCampaigns = async () => {
      const { data } = await axios.get("/api/campaigns");
      setCampaigns(data);
    };
    getCampaigns();
  }, []);

  return (
    <>
      {campaigns && campaigns.length > 0 ? (
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          {campaigns
            .sort((a, b) => (a.dateCreated < b.dateCreated ? 1 : -1)) // Most recent 1st
            .map((campaign) => (
              <GridItem
                key={campaign.id}
                as={Link}
                href={`/campaigns/${campaign.id}`}
                w="full"
                bg="gray.100"
                p="4"
                borderRadius="md"
                display="flex"
                flexDir="column"
                gap="4"
              >
                {campaign.image ? (
                  <img src={campaign.image} style={{ maxHeight: "500px" }} />
                ) : (
                  <PlaceholderImage title={campaign.title} />
                )}
                <Heading size="sm">{campaign.title}</Heading>
                <Box>{campaign.description}</Box>
              </GridItem>
            ))}
        </Grid>
      ) : (
        <Box
          textAlign="center"
          border="1px dashed gray"
          borderRadius="md"
          p="12"
          mx="12"
        >
          {campaigns === null ? (
            <>Fetching fundraisers...</>
          ) : (
            <>
              <Box>There are no fundraisers to browse.</Box>
              {isWalletConnected ? (
                <Box>
                  Do you want to{" "}
                  <Text
                    as={Link}
                    href="/campaigns/new"
                    color="blue"
                    textDecor="underline"
                  >
                    create a new one
                  </Text>
                  ?
                </Box>
              ) : null}
            </>
          )}
        </Box>
      )}
    </>
  );
};

export default CampaignsList;
