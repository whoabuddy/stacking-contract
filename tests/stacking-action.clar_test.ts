import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.3.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";

const poxVer = "0x01";
const poxHash = "0x13effebe0ea4bb45e35694f5a15bb5b96e851afb";

Clarinet.test({
  name: "stacking fails if not called by the admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const user = accounts.get("wallet_1")!;
    const pool = accounts.get("wallet_2")!;

    // act
    const block = chain.mineBlock([
      Tx.contractCall(
        "stacking-action",
        "stack-stx",
        [
          types.uint(amount),
          types.principal(pool.address),
          poxVer,
          poxHash,
          types.none(),
        ],
        user.address
      ),
    ]);

    // assert
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(1000);
  },
});

Clarinet.test({
  name: "stacking succeeds if called by the admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const admin = accounts.get("deployer")!;
    const pool = accounts.get("wallet_2")!;

    // act
    const block = chain.mineBlock([
      Tx.contractCall(
        "stacking-action",
        "stack-stx",
        [
          types.uint(amount),
          types.principal(pool.address),
          poxVer,
          poxHash,
          types.none(),
        ],
        admin.address
      ),
    ]);

    // assert
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "revoking fails if not called by the admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const user = accounts.get("wallet_1")!;

    // act
    const block = chain.mineBlock([
      Tx.contractCall("stacking-action", "unstack-stx", [], user.address),
    ]);

    // assert
    block.receipts[0].result.expectErr().expectUint(1000);
  },
});

Clarinet.test({
  name: "revoking succeeds and returns false if not delegating",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const admin = accounts.get("deployer")!;

    // act
    const block = chain.mineBlock([
      Tx.contractCall("stacking-action", "unstack-stx", [], admin.address),
    ]);

    // assert
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(false);
  },
});

Clarinet.test({
  name: "revoking succeeds and returns true if already delegating",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const admin = accounts.get("deployer")!;
    chain.mineBlock([
      Tx.contractCall(
        "stacking-action",
        "stack-stx",
        [
          types.uint(amount),
          types.principal(admin.address),
          poxVer,
          poxHash,
          types.none(),
        ],
        admin.address
      ),
    ]);

    // act
    const block = chain.mineBlock([
      Tx.contractCall("stacking-action", "unstack-stx", [], admin.address),
    ]);

    // assert
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "deposit succeeds if called by any user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const user_1 = accounts.get("wallet_1")!;
    const user_3 = accounts.get("wallet_3")!;
    const user_5 = accounts.get("wallet_5")!;

    // act
    const block = chain.mineBlock([
      Tx.contractCall(
        "stacking-action",
        "deposit-stx",
        [types.principal(user_1.address), types.uint(amount)],
        user_1.address
      ),
      Tx.contractCall(
        "stacking-action",
        "deposit-stx",
        [types.principal(user_3.address), types.uint(amount)],
        user_3.address
      ),
      Tx.contractCall(
        "stacking-action",
        "deposit-stx",
        [types.principal(user_5.address), types.uint(amount)],
        user_5.address
      ),
    ]);

    // assert
    for (const receipt of block.receipts) {
      receipt.result.expectOk().expectBool(true);
    }
  },
});

Clarinet.test({
  name: "withdrawal fails if not called by the admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const user = accounts.get("wallet_1")!;
    const recipient = accounts.get("wallet_2")!;

    // act
    const block = chain.mineBlock([
      Tx.contractCall(
        "stacking-action",
        "withdraw-stx",
        [types.principal(recipient.address), types.uint(amount)],
        user.address
      ),
    ]);

    // assert
    block.receipts[0].result.expectErr().expectUint(1000);
  },
});

Clarinet.test({
  name: "withdrawal succeeds if called by the admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const admin = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall(
        "stacking-action",
        "deposit-stx",
        [types.principal(admin.address), types.uint(amount)],
        admin.address
      ),
    ]);

    // act
    const block = chain.mineBlock([
      Tx.contractCall(
        "stacking-action",
        "withdraw-stx",
        [types.principal(recipient.address), types.uint(amount)],
        admin.address
      ),
    ]);

    // assert
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});
