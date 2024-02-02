import { Box, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Campaign } from "../../app/models";
import { ustxToStx } from "../../utils/token-utils";
import StacksIcon from "../icons/StacksIcon";
import { truncateMiddle } from "../../utils/string-utils";
import useCurrentChainTip from "../hooks/useCurrentChainTip";

const CampaignDetails = ({
  campaign,
  chainTip,
}: {
  campaign: Campaign;
  chainTip: number | null;
}) => {
  const isExpired =
    chainTip && chainTip > (campaign.blockHeightExpiration || 0);

  return (
    <Flex direction="column" gap="6" bg="gray.100" p="6" borderRadius="md">
      <Box>
        <Text fontWeight="bold" textTransform="uppercase">
          Fundraiser #{campaign.id} /
        </Text>
        <Heading size="3xl">{campaign.title}</Heading>
      </Box>
      {campaign.image ? (
        <Box maxW="700px">
          <img src={campaign.image} />
        </Box>
      ) : null}
      <Box fontSize="2xl">
        {campaign.description}{" "}
        {campaign.url ? (
          <Link
            href={campaign.url}
            textDecor="underline"
            color="blue.600"
            target="_blank"
          >
            Learn more.
          </Link>
        ) : null}
      </Box>
      <Flex direction="column" gap="4">
        <Flex gap="3">
          <Box fontWeight="bold">Funding goal</Box>
          <Flex>
            <StacksIcon mt="1" mr="1" />
            {ustxToStx(campaign.fundingGoal)}
          </Flex>
        </Flex>
        <Flex gap="3">
          <Box fontWeight="bold">Created on</Box>
          <Flex>{new Date(campaign.dateCreated).toLocaleString()}</Flex>
        </Flex>
        {campaign.blockHeightExpiration ? (
          <>
            <Flex gap="3">
              <Box fontWeight="bold">
                Expire{isExpired ? "d" : "s"} at block
              </Box>
              <Box># {campaign.blockHeightExpiration}</Box>
            </Flex>
            {chainTip ? (
              <>
                {isExpired ? (
                  <Flex gap="3">
                    <Box fontWeight="bold">Expired</Box>
                    <Box>
                      {chainTip - campaign.blockHeightExpiration} blocks ago
                    </Box>
                  </Flex>
                ) : (
                  <Flex gap="3">
                    <Box fontWeight="bold">Expires in</Box>
                    <Box>
                      {campaign.blockHeightExpiration - chainTip} blocks
                    </Box>
                  </Flex>
                )}
              </>
            ) : null}
          </>
        ) : null}
        <Flex gap="3">
          <Box fontWeight="bold">Created in Stacks transaction</Box>
          <Flex gap="2">
            <Link
              color="blue.600"
              textDecor="underline"
              href={`https://explorer.hiro.so/txid/${campaign.chainTxId}`}
              target="_blank"
            >
              0x{truncateMiddle(campaign.chainTxId)}
            </Link>
            <Box>
              (
              {campaign.chainIsPending
                ? "pending"
                : campaign.chainConfirmedId
                ? "confirmed"
                : "failed"}
              )
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default CampaignDetails;
