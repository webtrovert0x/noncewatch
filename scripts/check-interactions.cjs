async function check() {
  const url = "https://scan.botchain.ai/api?module=account&action=txlist&address=0x5D9e60Fd6eF30e58EfC16BD00CFbBFB4C3297c73";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const json = await res.json();
  const txs = json.result;

  console.log(`Total transactions found: ${txs.length}\n`);

  const uniqueFroms = new Set();
  txs.forEach((tx, i) => {
    uniqueFroms.add(tx.from.toLowerCase());
    console.log(`[${i}] Hash: ${tx.hash}`);
    console.log(`    From: ${tx.from}`);
    console.log(`    To: ${tx.to}`);
    console.log(`    Block: ${tx.blockNumber}`);
    console.log(`    Method ID / Input prefix: ${tx.input ? tx.input.slice(0, 10) : 'none'}`);
    console.log(`    Status: ${tx.txreceipt_status === '1' ? 'Success' : 'Failed'}`);
    console.log(`    Explorer Link: https://scan.botchain.ai/tx/${tx.hash}\n`);
  });

  console.log(`Unique Addresses (${uniqueFroms.size}):`, Array.from(uniqueFroms));
}

check();
