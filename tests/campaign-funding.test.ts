
import { Cl, ClarityType, cvToJSON, cvToValue, tupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/clarinet/feature-guides/test-contract-with-clarinet-sdk
*/

describe("test setup", () => {
  it("ensures simnet is initialized and campaign-funding contract is available", () => {
    expect(simnet.blockHeight).toBeDefined();

    const { result } = simnet.callReadOnlyFn('campaign-funding', 'get-status', [], address1);
    expect(result).toBeOk(Cl.stringUtf8("ok"));
  });
});

// Example campaign data
const title = "Test Campaign";
const goal = 50000;
const hash = "70573301787ea4db801ca44a7b9ecd28";

function buildCampaignData (blockHeight: number, blockDuration: number = 50) {
  return {
    title: Cl.stringUtf8(title),
    'stx-goal': Cl.uint(goal),
    'end-block-height': Cl.uint(blockHeight + blockDuration),
    'data-hash': Cl.bufferFromUtf8(hash),
    'owner': Cl.principal(address1),
  }
};

function addCampaign (blockDuration: number = 50) {
  const { result: addCampaignResult } = simnet.callPublicFn('campaign-funding', 'add-campaign', [Cl.stringUtf8(title), Cl.uint(goal), Cl.uint(blockDuration), Cl.bufferFromUtf8(hash)], address1);
  expect(addCampaignResult).toBeOk(expect.toHaveClarityType(ClarityType.UInt));
  const { value: newCampaignId } = cvToValue(addCampaignResult);

  const { result: getCampaignResult } = simnet.callReadOnlyFn('campaign-funding', 'get-campaign', [Cl.uint(newCampaignId)], address2)

  const blockHeightAtCreation = simnet.blockHeight;
  const expectedCampaign = Cl.tuple(buildCampaignData(blockHeightAtCreation, blockDuration));
  expect(getCampaignResult.value).toEqual(expectedCampaign);

  return { newCampaignId, blockHeightAtCreation };
}

function getCurrentStxBalance (address: string) {
  const assetsMap = simnet.getAssetsMap()
  return assetsMap.get("STX")?.get(address) || BigInt(0);
}

describe('add-campaign', () => {
  it('adds a campaign and initializes its contribution data', () => {
    const { newCampaignId } = addCampaign();

    const { result: getCampaignFundingTotalsResult } = simnet.callReadOnlyFn('campaign-funding', 'get-campaign-funding-totals', [Cl.uint(newCampaignId)], address2)

    const expectedTotals = Cl.tuple({
      'funding-total-amount': Cl.uint(0),
      'total-num-contributions': Cl.uint(0),
      'is-collected': Cl.bool(false)
    });

    expect(getCampaignFundingTotalsResult.value).toEqual(expectedTotals);
  });
});

describe('update-campaign-data', () => {
  it('updates campaign data', () => {
    const { newCampaignId, blockHeightAtCreation } = addCampaign();

    const newTitle = 'Updated Campaign Title';
    const newHash = '848573nfk38fj4kl3r4565234567kkll';

    const { result: updateCampaignResult } = simnet.callPublicFn('campaign-funding', 'update-campaign-data', [Cl.uint(newCampaignId), Cl.stringUtf8(newTitle), Cl.bufferFromUtf8(newHash)], address1)
    expect(updateCampaignResult).toBeOk(Cl.uint(newCampaignId));

    const { result: getCampaignResult } = simnet.callReadOnlyFn('campaign-funding', 'get-campaign', [Cl.uint(newCampaignId)], address1)
    const expectedCampaign = Cl.tuple({
      ...buildCampaignData(blockHeightAtCreation),
      "title": Cl.stringUtf8(newTitle),
      "data-hash": Cl.bufferFromUtf8(newHash),
    });
    expect(getCampaignResult.value).toEqual(expectedCampaign);
  });

  it('fails updating campaign data as an account that does not own it', () => {
    const { newCampaignId } = addCampaign();

    const newTitle = 'Updated Campaign Title';
    const newHash = '848573nfk38fj4kl3r4565234567kkll';

    const { result: updateCampaignResult } = simnet.callPublicFn('campaign-funding', 'update-campaign-data', [Cl.uint(newCampaignId), Cl.stringUtf8(newTitle), Cl.bufferFromUtf8(newHash)], address2)
    expect(updateCampaignResult).toBeErr(Cl.uint(3)); // u3 = not allowed
  });
});

describe('contribute-to-campaign', () => {
  it('collects a contribution from caller and updates funding data for the campaign', () => {
    const startingStxBalance = getCurrentStxBalance(address1);

    const amountContributed = 8000;
    const { newCampaignId } = addCampaign();

    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address1)
    expect(contributeResult).toBeOk(Cl.bool(true));

    // Check that STX funds were collected - the balance of contributor and contract have been changed
    const newStxBalance = getCurrentStxBalance(address1);
    const contracts = simnet.getContractsInterfaces();
    const contractAddress = contracts.keys().next().value;
    const contractStxBalance = getCurrentStxBalance(contractAddress);

    expect(newStxBalance).toBe(startingStxBalance - BigInt(amountContributed));
    expect(contractStxBalance).toBe(BigInt(amountContributed));

    // Check campaign contribution data
    const { result: getCampaignFundingTotalsResult } = simnet.callReadOnlyFn('campaign-funding', 'get-campaign-funding-totals', [Cl.uint(newCampaignId)], address1)
    const expectedTotals = Cl.tuple({
      'funding-total-amount': Cl.uint(amountContributed),
      'total-num-contributions': Cl.uint(1),
      'is-collected': Cl.bool(false)
    });
    expect(getCampaignFundingTotalsResult.value).toEqual(expectedTotals);

    // Check contribution info for account
    const { result: contributionResult } = simnet.callReadOnlyFn('campaign-funding', 'get-contribution-info', [Cl.uint(newCampaignId)], address1)
    const expectedContribution = Cl.tuple({
      'amount': Cl.uint(amountContributed),
      'is-refunded': Cl.bool(false)
    });
    expect(contributionResult.value).toEqual(expectedContribution);
  });

  it('fails and does not collect stx if the campaign has already ended', () => {
    const startingStxBalance = getCurrentStxBalance(address1);
    // Create a campaign with duration of 2 blocks
    const { newCampaignId } = addCampaign(2);

    // Mine 2 blocks
    simnet.mineBlock([]);
    simnet.mineBlock([]);

    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(1000)], address1)
    expect(contributeResult).toBeErr(Cl.uint(4)); // error-campaign-ended
    
    // Check that stx balance has not changed
    const endingStxBalance = getCurrentStxBalance(address1);
    expect(startingStxBalance).toEqual(endingStxBalance);
  });

  it('sums contributions by the same address, and keeps data updated for contributions from different addresses', () => {
    const startingStxBalanceAccount1 = getCurrentStxBalance(address1);
    const startingStxBalanceAccount2 = getCurrentStxBalance(address2);

    const contributionAmount1 = 3000; // Will be by address 1
    const contributionAmount2 = 7000; // Will be by address 1
    const contributionAmount3 = 15000; // Will be by address 2

    const contributionTotalAccount1 = contributionAmount1 + contributionAmount2;
    const contributionTotal = contributionAmount1 + contributionAmount2 + contributionAmount3;

    const { newCampaignId } = addCampaign();

    const { result: contributeResult1 } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(contributionAmount1)], address1)
    expect(contributeResult1).toBeOk(Cl.bool(true));
    const { result: contributeResult2 } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(contributionAmount2)], address1)
    expect(contributeResult2).toBeOk(Cl.bool(true));
    const { result: contributeResult3 } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(contributionAmount3)], address2)
    expect(contributeResult3).toBeOk(Cl.bool(true));

    // Check that STX funds were collected - the balance of contributor and contract have been changed
    const newStxBalanceAccount1 = getCurrentStxBalance(address1);
    const newStxBalanceAccount2 = getCurrentStxBalance(address2);
    const contracts = simnet.getContractsInterfaces();
    const contractAddress = contracts.keys().next().value;
    const contractStxBalance = getCurrentStxBalance(contractAddress);

    expect(newStxBalanceAccount1).toBe(startingStxBalanceAccount1 - BigInt(contributionTotalAccount1));
    expect(newStxBalanceAccount2).toBe(startingStxBalanceAccount2 - BigInt(contributionAmount3));
    expect(contractStxBalance).toBe(BigInt(contributionTotal));

    // Check campaign contribution data
    const { result: getCampaignFundingTotalsResult } = simnet.callReadOnlyFn('campaign-funding', 'get-campaign-funding-totals', [Cl.uint(newCampaignId)], address1)
    const expectedTotals = Cl.tuple({
      'funding-total-amount': Cl.uint(contributionTotal),
      'total-num-contributions': Cl.uint(3),
      'is-collected': Cl.bool(false)
    });
    expect(getCampaignFundingTotalsResult.value).toEqual(expectedTotals);

    // Check contribution info for accounts
    const { result: contributionResultAccount1 } = simnet.callReadOnlyFn('campaign-funding', 'get-contribution-info', [Cl.uint(newCampaignId)], address1)
    expect(contributionResultAccount1.value).toEqual(Cl.tuple({
      'amount': Cl.uint(contributionTotalAccount1),
      'is-refunded': Cl.bool(false)
    }));
    const { result: contributionResultAccount2 } = simnet.callReadOnlyFn('campaign-funding', 'get-contribution-info', [Cl.uint(newCampaignId)], address2)
    expect(contributionResultAccount2.value).toEqual(Cl.tuple({
      'amount': Cl.uint(contributionAmount3),
      'is-refunded': Cl.bool(false)
    }));
  });
});

describe('refund-contribution', () => {
  it('refunds a contribution back to the given contributor', () => {
    const startingStxBalance = getCurrentStxBalance(address1);

    // Create a campaign with duration of 2 blocks
    const { newCampaignId } = addCampaign(2);

    // Make contribution with account1
    const amountContributed = 8000;
    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address1)
    expect(contributeResult).toBeOk(Cl.bool(true));

    // Mine 2 blocks to expire the campaign
    simnet.mineBlock([]);
    simnet.mineBlock([]);

    // Call refund (call as account2 to test that the refund is for the contributor in the args)
    const { result: refundResult } = simnet.callPublicFn('campaign-funding', 'refund-contribution', [Cl.uint(newCampaignId), Cl.principal(address1)], address2)
    expect(refundResult).toBeOk(Cl.bool(true));

    // Verify refund occurred
    const endingStxBalance = getCurrentStxBalance(address1);
    expect(startingStxBalance).toEqual(endingStxBalance);

    // Check contribution info for account
    const { result: contributionResult } = simnet.callReadOnlyFn('campaign-funding', 'get-contribution-info', [Cl.uint(newCampaignId)], address1)
    const expectedContribution = Cl.tuple({
      'amount': Cl.uint(amountContributed),
      'is-refunded': Cl.bool(true)
    });
    expect(contributionResult.value).toEqual(expectedContribution);
  });

  it('fails if campaign is not expired', () => {
    const { newCampaignId } = addCampaign();

    // Make contribution with account1
    const amountContributed = 8000;
    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address1)
    expect(contributeResult).toBeOk(Cl.bool(true));

    // Refund should fail because campaign is still open
    const { result: refundResult } = simnet.callPublicFn('campaign-funding', 'refund-contribution', [Cl.uint(newCampaignId), Cl.principal(address1)], address2)
    expect(refundResult).toBeErr(Cl.uint(6)); // error-campaign-not-ended
  });

  it('fails if campaign met its funding goal', () => {
    // Create a campaign with duration of 2 blocks
    const { newCampaignId } = addCampaign(2);

    // Make contribution with account1 to meet the funding goal
    const amountContributed = 50000;
    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address1)
    expect(contributeResult).toBeOk(Cl.bool(true));

    // Mine 2 blocks to expire the campaign
    simnet.mineBlock([]);
    simnet.mineBlock([]);

    // Refund should fail because the campaign met its goal and therefore cannot be refunded
    const { result: refundResult } = simnet.callPublicFn('campaign-funding', 'refund-contribution', [Cl.uint(newCampaignId), Cl.principal(address1)], address2)
    expect(refundResult).toBeErr(Cl.uint(9)); // error-campaign-succeeded-no-refund
  });

  it('cannot refund the same contribution more than once', () => {
    // Create a campaign with duration of 2 blocks
    const { newCampaignId } = addCampaign(2);

    // Make contribution with account1
    const amountContributed = 8000;
    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address1)
    expect(contributeResult).toBeOk(Cl.bool(true));

    // Mine 2 blocks to expire the campaign
    simnet.mineBlock([]);
    simnet.mineBlock([]);

    // Call refund (call as account2 to test that the refund is for the contributor in the args)
    const { result: refundResult } = simnet.callPublicFn('campaign-funding', 'refund-contribution', [Cl.uint(newCampaignId), Cl.principal(address1)], address2)
    expect(refundResult).toBeOk(Cl.bool(true));

    // Call refund a second time, should fail because the refund was already processed
    const { result: refundResult2 } = simnet.callPublicFn('campaign-funding', 'refund-contribution', [Cl.uint(newCampaignId), Cl.principal(address1)], address2)
    expect(refundResult2).toBeErr(Cl.uint(10)); // error-already-refunded
  });
});

describe('fund-campaign', () => {
  it('sends funds to the campaign owner', () => {
    const startingStxBalanceAccount1 = getCurrentStxBalance(address1);
    const startingStxBalanceAccount2 = getCurrentStxBalance(address2);

    // Create a campaign with duration of 2 blocks
    const { newCampaignId } = addCampaign(2);

    // Make contribution with account2 to meet funding goal
    const amountContributed = 50000;
    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address2)
    expect(contributeResult).toBeOk(Cl.bool(true));

    // Mine 2 blocks to expire the campaign
    simnet.mineBlock([]);
    simnet.mineBlock([]);

    const { result: fundResult } = simnet.callPublicFn('campaign-funding', 'fund-campaign', [Cl.uint(newCampaignId)], address2)
    expect(fundResult).toBeOk(Cl.bool(true));

    const contracts = simnet.getContractsInterfaces();
    const contractAddress = contracts.keys().next().value;

    expect(getCurrentStxBalance(address1)).toBe(startingStxBalanceAccount1 + BigInt(amountContributed));
    expect(getCurrentStxBalance(address2)).toBe(startingStxBalanceAccount2 - BigInt(amountContributed));
    expect(getCurrentStxBalance(contractAddress)).toBe(BigInt(0));
  });

  it('fails if campaign is not expired', () => {
    const { newCampaignId } = addCampaign();

    // Make contribution with account2 to meet funding goal
    const amountContributed = 50000;
    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address2)
    expect(contributeResult).toBeOk(Cl.bool(true));

    const { result: fundResult } = simnet.callPublicFn('campaign-funding', 'fund-campaign', [Cl.uint(newCampaignId)], address2)
    expect(fundResult).toBeErr(Cl.uint(6)); // error-campaign-not-ended
  });

  it('fails if campaign did not meet its funding goal', () => {
    // Create a campaign with duration of 2 blocks
    const { newCampaignId } = addCampaign(2);

    // Make contribution with account2, does not meet funding goal
    const amountContributed = 49999;
    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address2)
    expect(contributeResult).toBeOk(Cl.bool(true));

    // Mine 2 blocks to expire the campaign
    simnet.mineBlock([]);
    simnet.mineBlock([]);

    const { result: fundResult } = simnet.callPublicFn('campaign-funding', 'fund-campaign', [Cl.uint(newCampaignId)], address2)
    expect(fundResult).toBeErr(Cl.uint(13)); // error-campaign-failed
  });

  it('cannot fund the same campaign more than once', () => {
    // Create a campaign with duration of 2 blocks
    const { newCampaignId } = addCampaign(2);

    // Make contribution with account2 to meet funding goal
    const amountContributed = 50000;
    const { result: contributeResult } = simnet.callPublicFn('campaign-funding', 'contribute-to-campaign', [Cl.uint(newCampaignId), Cl.uint(amountContributed)], address2)
    expect(contributeResult).toBeOk(Cl.bool(true));

    // Mine 2 blocks to expire the campaign
    simnet.mineBlock([]);
    simnet.mineBlock([]);

    const { result: fundResult } = simnet.callPublicFn('campaign-funding', 'fund-campaign', [Cl.uint(newCampaignId)], address2)
    expect(fundResult).toBeOk(Cl.bool(true));

    const { result: fundResult2 } = simnet.callPublicFn('campaign-funding', 'fund-campaign', [Cl.uint(newCampaignId)], address2)
    expect(fundResult2).toBeErr(Cl.uint(11)); // error-already-collected
  });
});