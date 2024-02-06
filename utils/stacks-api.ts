import { Configuration } from "@stacks/blockchain-api-client";
import { StacksDevnet, StacksMainnet, StacksTestnet } from "@stacks/network";
import {
  TransactionStatus,
  MempoolTransactionStatus,
} from "@stacks/stacks-blockchain-api-types";

const isTestnet = process.env.STACKS_TESTNET;
const isMainnet = process.env.STACKS_MAINNET;

export const STACKS_API_ROOT_URL = isMainnet
  ? "https://api.mainnet.hiro.so"
  : isTestnet
  ? "https://api.testnet.hiro.so"
  : "http://localhost:3999";

export const BLOCKCHAIN_API_CONFIG = new Configuration({
  fetchApi: fetch,
  basePath: STACKS_API_ROOT_URL,
});

export const CONTRACT_DEPLOYER_ADDRESS = isMainnet
  ? "SPKDTDEAR9PX0YJGQQ34TNTY9087E3029JPF2AH1" // Mainnet
  : isTestnet
  ? "STKDTDEAR9PX0YJGQQ34TNTY9087E3029K3QJ9EK" // Testnet
  : "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"; // Devnet

export const CONTRACT_NAME = "campaign-funding";

const networkConfig = { url: STACKS_API_ROOT_URL };
export const STACKS_NETWORK = isMainnet
  ? new StacksMainnet(networkConfig)
  : isTestnet
  ? new StacksTestnet(networkConfig)
  : new StacksDevnet(networkConfig);

export const APPLICATION_ADDRESS =
  process.env.NEXT_PUBLIC_APP_STX_ADDRESS || "";

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
