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
} from "@chakra-ui/react";
import PageContainer from "../../../ui/components/PageContainer";
import AppHeader from "../../../ui/components/AppHeader";
import { useContext, useState } from "react";
import WalletContext from "../../../ui/context/WalletContext";
import ConnectWalletButton from "../../../ui/components/ConnectWalletButton";
import ImageUploader from "../../../ui/components/ImageUploader";
import StacksIcon from "../../../ui/icons/StacksIcon";
import { Campaign, getCampaignDataHash } from "../../models";

export default function Page() {
  const { isWalletConnected } = useContext(WalletContext);

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

  const handleCreateFundraiser = () => {
    // TODO
    // Create the campaign on-chain first, then save it in the db
    // But need to calculate the hash first
    const campaignDataHash = getCampaignDataHash(
      campaignData.title,
      campaignData.description,
      campaignData.url,
      campaignData.image
    );

    // Construct transaction to call add-campaign

    // Fetch the new campaign from on-chain

    // Store the campaign in application db
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
                    isDisabled={!isFormValid}
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
