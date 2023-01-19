import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.3.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";

// stacking fails if not called by the admin
Clarinet.test({
  name: "stacking fails if not called by the admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // arrange
    const amount = 1000000000; // 1,000 STX
    const poxVer = "1";
    const poxHash = "13effebe0ea4bb45e35694f5a15bb5b96e851afb";
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
          types.buff(poxVer),
          types.buff(poxHash),
          types.none(),
        ],
        user.address
      ),
    ]);

    // assert
    console.log(`block: ${JSON.stringify(block, null, 2)}`);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(1000);
  },
});
// stacking succeeds if called by the admin
// revoking fails if not called by the admin
// revoking succeeds if called by the admin
// withdrawing fails if not called by the admin
// withdrawing succeeds if called by the admin
