"use client";

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftAddon,
  Link,
  useToast,
} from "@chakra-ui/react";
import PageContainer from "../../../ui/components/PageContainer";
import AppHeader from "../../../ui/components/AppHeader";
import { useContext, useState } from "react";
import WalletContext from "../../../ui/context/WalletContext";
import ConnectWalletButton from "../../../ui/components/ConnectWalletButton";
import ImageUploader from "../../../ui/components/ImageUploader";
import StacksIcon from "../../../ui/icons/StacksIcon";
import { getCampaignDataHash } from "../../models";
import { stxToUstx } from "../../../utils/token-utils";
import {
  CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_NAME,
  STACKS_NETWORK,
} from "../../../utils/stacks-api";
import { Cl } from "@stacks/transactions";
import {
  ContractCallOptions,
  FinishedTxData,
  openContractCall,
} from "@stacks/connect";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Page() {
  const toast = useToast();
  const router = useRouter();
  const { isWalletConnected } = useContext(WalletContext);

  const [isLoading, setIsLoading] = useState(false);
  const [campaignData, setCampaignData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    blockDuration: "",
    fundingGoal: "",
  });

  const changeCampaignData = (key: string, val: any) => {
    setCampaignData((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleCreateFundraiser = async () => {
    setIsLoading(true);

    // Calculate data hash to save on-chain
    const campaignDataHash = getCampaignDataHash(
      campaignData.title,
      campaignData.description,
      campaignData.url,
      campaignData.image
    );

    // Construct transaction to call add-campaign
    const addCampaignContractCallOptions: ContractCallOptions = {
      network: STACKS_NETWORK,
      contractName: CONTRACT_NAME,
      contractAddress: CONTRACT_DEPLOYER_ADDRESS,
      functionName: "add-campaign",
      functionArgs: [
        Cl.stringUtf8(campaignData.title),
        Cl.uint(stxToUstx(campaignData.fundingGoal)),
        Cl.uint(campaignData.blockDuration),
        Cl.stringUtf8(campaignDataHash),
      ],
      onCancel: () => {
        setIsLoading(false);
      },
      onFinish: async (data: FinishedTxData) => {
        const chainTxId = data.txId; // Transaction ID of the contract call
        const newCampaign = {
          chainTxId,
          chainIsPending: true,
          title: campaignData.title,
          description: campaignData.description,
          url: campaignData.url,
          image: campaignData.image,
          fundingGoal: stxToUstx(campaignData.fundingGoal),
          totalRaised: 0,
          dateCreated: Date.now(),
          dateUpdated: Date.now(),
        };

        // Initialize the campaign in the database: POST /api/campaigns
        try {
          const { data } = await axios.post("/api/campaigns", newCampaign);
          toast({
            status: "info",
            title: "You sent a request to open a new fundraiser",
            description:
              "Your new fundraiser is pending creation, and will be available once confirmed.",
          });
          router.push(`/campaigns/${data?.id}`);
        } catch (error) {
          console.error({ error });
          toast({
            status: "error",
            title: "Error creating fundraiser",
            description: "There was a problem creating your fundraiser.",
          });
        }

        setIsLoading(false);

        // When the chain tx is confirmed, the campaign will be updated with the on-chain
        // confirmed data via a chainhook (see /api/webhooks/new-block)
      },
    };

    try {
      await openContractCall(addCampaignContractCallOptions);
    } catch (error) {
      console.error(error);
      toast({
        status: "error",
        title: "Error creating fundraiser",
        description:
          "There was a problem creating your fundraiser. Please try again later.",
      });
    }
  };

  const isFormValid =
    !!campaignData.title &&
    !!campaignData.description &&
    !!campaignData.blockDuration &&
    !Number.isNaN(campaignData.blockDuration) &&
    !!campaignData.fundingGoal &&
    !Number.isNaN(campaignData.fundingGoal);

  return (
    <PageContainer>
      <Flex direction="column" gap="8">
        <AppHeader />
        {isWalletConnected ? (
          <Flex direction="column" maxW="600px" mx="auto" gap="4">
            <Flex justify="space-between" align="center">
              <Heading size="md">Create a new Fundraiser</Heading>
            </Flex>

            {/* Form */}
            <Flex direction="column" gap="12">
              <Flex direction="column" gap="8">
                {/* Title (required) */}
                <FormControl bg="gray.100" p="6" borderRadius="md">
                  <FormLabel>Title *</FormLabel>
                  <Input
                    bg="white"
                    maxLength={200}
                    placeholder="Title"
                    value={campaignData.title}
                    onChange={(e) => {
                      changeCampaignData("title", e.target.value);
                    }}
                  />
                  <FormHelperText>
                    What should we call your fundraiser or project?
                  </FormHelperText>
                </FormControl>

                {/* Short description (required) */}
                <FormControl bg="gray.100" p="6" borderRadius="md">
                  <FormLabel>Description *</FormLabel>
                  <Input
                    bg="white"
                    maxLength={200}
                    placeholder="Description"
                    value={campaignData.description}
                    onChange={(e) => {
                      changeCampaignData("description", e.target.value);
                    }}
                  />
                  <FormHelperText>
                    A short description or headline for your fundraiser.
                  </FormHelperText>
                </FormControl>

                {/* Project URL */}
                <FormControl bg="gray.100" p="6" borderRadius="md">
                  <FormLabel>Project URL</FormLabel>
                  <Input
                    bg="white"
                    maxLength={200}
                    placeholder="https://my-project.is/cool"
                    value={campaignData.url}
                    onChange={(e) => {
                      changeCampaignData("url", e.target.value);
                    }}
                  />
                  <FormHelperText>
                    Does your project have a public web page to help tell your
                    story?
                  </FormHelperText>
                </FormControl>

                {/* Image */}
                <FormControl bg="gray.100" p="6" borderRadius="md">
                  <FormLabel>Image</FormLabel>
                  <ImageUploader
                    imageUrl={campaignData.image}
                    onImageUploaded={(newImageUrl: string) => {
                      changeCampaignData("image", newImageUrl);
                    }}
                  />
                  <FormHelperText>
                    Upload an eye-catching logo or banner for your fundraiser.
                  </FormHelperText>
                </FormControl>

                {/* Funding goal */}
                <FormControl bg="gray.100" p="6" borderRadius="md">
                  <FormLabel>Funding goal *</FormLabel>
                  <InputGroup>
                    <InputLeftAddon
                      bg="purple.600"
                      color="white"
                      borderColor="purple.600"
                    >
                      <StacksIcon />
                    </InputLeftAddon>
                    <Input
                      bg="white"
                      type="number"
                      placeholder="STX amount"
                      value={campaignData.fundingGoal}
                      onChange={(e) => {
                        changeCampaignData("fundingGoal", e.target.value);
                      }}
                    />
                  </InputGroup>
                  <FormHelperText>
                    <Box>What's your fundraising goal (in STX)?</Box>
                    <Box mt="2">
                      If this goal is reached by the end of the campaign, you'll
                      receive the funds. If not, all funds raised will be
                      returned to the backers.
                    </Box>
                    {/* TODO: show current STX price */}
                  </FormHelperText>
                </FormControl>

                {/* Block duration */}
                <FormControl bg="gray.100" p="6" borderRadius="md">
                  <FormLabel>Duration of campaign (in blocks) *</FormLabel>
                  <Input
                    bg="white"
                    type="number"
                    placeholder="Number of blocks"
                    value={campaignData.blockDuration}
                    onChange={(e) => {
                      changeCampaignData("blockDuration", e.target.value);
                    }}
                  />
                  <FormHelperText>
                    <Box>
                      Your fundraising campaign will run for a set number of{" "}
                      <Link
                        color="blue.500"
                        textDecor="underline"
                        target="_blank"
                        href="https://explorer.hiro.so/blocks?chain=mainnet"
                      >
                        blocks
                      </Link>{" "}
                      mined on the Stacks blockchain.
                    </Box>
                    <Box mt="2">
                      Around 120 blocks are mined every 24 hours. (1 week ~840
                      blocks; 1 month ~3600 blocks.) This <em>guesstimate</em>{" "}
                      is based on historical info, and will always vary.
                    </Box>
                  </FormHelperText>
                </FormControl>
              </Flex>

              {/* Submit button */}
              <Flex direction="column" gap="2">
                <Box>
                  <Button
                    isDisabled={!isFormValid || isLoading}
                    isLoading={isLoading}
                    onClick={handleCreateFundraiser}
                    variant="solid"
                    colorScheme="purple"
                  >
                    Create Fundraiser
                  </Button>
                </Box>
                <Box fontSize="sm">* Required</Box>
                <Box fontSize="sm">
                  Your connected wallet will be prompted to approve your
                  submission.
                </Box>
              </Flex>
            </Flex>
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap="4">
            Connect your wallet to create a new Fundraiser.
            <ConnectWalletButton variant="solid" colorScheme="purple" />
          </Flex>
        )}
      </Flex>
    </PageContainer>
  );
}
