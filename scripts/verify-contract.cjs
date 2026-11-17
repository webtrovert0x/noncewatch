const fs = require('fs');
const path = require('path');

async function verify() {
  const contractAddress = '0x5D9e60Fd6eF30e58EfC16BD00CFbBFB4C3297c73';
  const sourceCode = fs.readFileSync(path.join(__dirname, '../contracts/NonceWatchRegistry.sol'), 'utf8');

  console.log('Submitting verification to scan.botchain.ai for:', contractAddress);

  // Method 1: Blockscout v2 API
  try {
    const payloadV2 = {
      compiler_version: 'v0.8.20+commit.a1b79de6',
      source_code: sourceCode,
      is_optimization_enabled: true,
      optimization_runs: 200,
      contract_name: 'NonceWatchRegistry',
      autodetect_constructor_args: true,
      constructor_arguments: '',
      evm_version: 'paris',
      license_type: 'mit'
    };

    console.log('Trying Blockscout v2 API...');
    const resV2 = await fetch(`https://scan.botchain.ai/api/v2/smart-contracts/${contractAddress}/verification/via/flattened-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(payloadV2)
    });

    const textV2 = await resV2.text();
    console.log('Blockscout v2 response status:', resV2.status);
    console.log('Blockscout v2 response:', textV2.slice(0, 500));
  } catch (err) {
    console.log('Blockscout v2 error:', err.message);
  }

  // Method 2: Blockscout standard Etherscan-compatible API
  try {
    console.log('\nTrying Blockscout Etherscan-compatible API (verifysourcecode)...');
    const params = new URLSearchParams();
    params.append('module', 'contract');
    params.append('action', 'verifysourcecode');
    params.append('contractaddress', contractAddress);
    params.append('sourceCode', sourceCode);
    params.append('contractname', 'NonceWatchRegistry');
    params.append('compilerversion', 'v0.8.20+commit.a1b79de6');
    params.append('optimizationUsed', '1');
    params.append('runs', '200');
    params.append('evmversion', 'paris');
    params.append('licenseType', '3'); // MIT

    const resV1 = await fetch('https://scan.botchain.ai/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: params.toString()
    });

    const textV1 = await resV1.text();
    console.log('Blockscout v1 response status:', resV1.status);
    console.log('Blockscout v1 response:', textV1);
  } catch (err) {
    console.log('Blockscout v1 error:', err.message);
  }
}

verify();
