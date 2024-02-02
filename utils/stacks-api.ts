import { Configuration } from "@stacks/blockchain-api-client";
import { StacksDevnet } from "@stacks/network";
import {
  TransactionStatus,
  MempoolTransactionStatus,
} from "@stacks/stacks-blockchain-api-types";

// TODO: make this file dynamic/env var driven
export const STACKS_API_ROOT_URL = "http://localhost:3999";

// https://api.mainnet.hiro.so
// https://api.testnet.hiro.so
// Local devnet: http://localhost:3999/doc
export const BLOCKCHAIN_API_CONFIG = new Configuration({
  fetchApi: fetch,
  basePath: STACKS_API_ROOT_URL,
});

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

export const TX_STATUS_PENDING: MempoolTransactionStatus = "pending";
export const TX_STATUS_SUCCEEDED: TransactionStatus = "success";
