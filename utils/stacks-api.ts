import { StacksDevnet } from "@stacks/network";

// TODO: make this file dynamic/env var driven
export const STACKS_API_ROOT_URL = "http://localhost:3999";

// https://api.mainnet.hiro.so
// https://api.testnet.hiro.so
// Local devnet: http://localhost:3999/doc

export const CONTRACT_DEPLOYER_ADDRESS =
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
export const CONTRACT_NAME = "campaign-funding";
export const STACKS_NETWORK = new StacksDevnet({
  url: STACKS_API_ROOT_URL,
});

export const APPLICATION_ADDRESS = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

export type ContractFunctionName =
  | "add-campaign"
  | "update-campaign-data"
  | "contribute-to-campaign"
  | "refund-contribution"
  | "fund-campaign"
  | "get-campaign"
  | "is-campaign-expired"
  | "get-campaign-funding-totals"
  | "get-contribution-info";
