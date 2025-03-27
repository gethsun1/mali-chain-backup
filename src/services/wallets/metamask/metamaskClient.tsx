import { ContractId, AccountId } from "@hashgraph/sdk";
import { TokenId } from "@hashgraph/sdk/lib/transaction/TransactionRecord";
// ethers v6: use BrowserProvider instead of Web3Provider
import { BrowserProvider, parseEther, Contract, JsonRpcSigner } from "ethers";
import { useContext, useEffect } from "react";
import { appConfig } from "../../../config";
import { MetamaskContext } from "../../../contexts/MetamaskContext";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";
import { WalletInterface } from "../walletInterface";

const currentNetworkConfig = appConfig.networks.testnet;

export const switchToHederaNetwork = async (ethereum: any) => {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: currentNetworkConfig.chainId }] // chainId must be in hexadecimal numbers
    });
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: `Hedera (${currentNetworkConfig.network})`,
              chainId: currentNetworkConfig.chainId,
              nativeCurrency: {
                name: 'HBAR',
                symbol: 'HBAR',
                decimals: 18
              },
              rpcUrls: [currentNetworkConfig.jsonRpcUrl]
            },
          ],
        });
      } catch (addError) {
        console.error(addError);
      }
    }
    console.error(error);
  }
};

const { ethereum } = window as any;
const getProvider = () => {
  if (!ethereum) {
    throw new Error("Metamask is not installed! Go install the extension!");
  }
  // Use BrowserProvider from ethers v6
  return new BrowserProvider(ethereum);
};

// returns a list of accounts (as addresses)
export const connectToMetamask = async (): Promise<string[]> => {
  const provider = getProvider();
  let addresses: string[] = [];
  try {
    await switchToHederaNetwork(ethereum);
    // provider.listAccounts() returns an array of JsonRpcSigner, so we map them to addresses
    const signers: JsonRpcSigner[] = await provider.listAccounts();
    addresses = await Promise.all(signers.map(signer => signer.getAddress()));
  } catch (error: any) {
    if (error.code === 4001) {
      console.warn("Please connect to Metamask.");
    } else {
      console.error(error);
    }
  }
  return addresses;
};

class MetaMaskWallet implements WalletInterface {
  private convertAccountIdToSolidityAddress(accountId: AccountId): string {
    const accountIdString = accountId.evmAddress !== null
      ? accountId.evmAddress.toString()
      : accountId.toSolidityAddress();
    return `0x${accountIdString}`;
  }

  // Purpose: Transfer HBAR using JSON RPC Relay
  async transferHBAR(toAddress: AccountId, amount: number): Promise<string | null> {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const tx = await signer.populateTransaction({
      to: this.convertAccountIdToSolidityAddress(toAddress),
      value: parseEther(amount.toString()),
    });
    try {
      const txResponse = await signer.sendTransaction(tx);
      await provider.waitForTransaction(txResponse.hash);
      return txResponse.hash;
    } catch (error: any) {
      console.warn(error.message ? error.message : error);
      return null;
    }
  }

  async transferFungibleToken(toAddress: AccountId, tokenId: TokenId, amount: number): Promise<string | null> {
    const hash = await this.executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      'transfer',
      new ContractFunctionParameterBuilder()
        .addParam({
          type: "address",
          name: "recipient",
          value: this.convertAccountIdToSolidityAddress(toAddress)
        })
        .addParam({
          type: "uint256",
          name: "amount",
          value: amount
        }),
      appConfig.constants.METAMASK_GAS_LIMIT_TRANSFER_FT
    );
    return hash;
  }

  async transferNonFungibleToken(toAddress: AccountId, tokenId: TokenId, serialNumber: number): Promise<string | null> {
    const provider = getProvider();
    // Get signers and then map to addresses
    const signers: JsonRpcSigner[] = await provider.listAccounts();
    const addresses: string[] = await Promise.all(signers.map(signer => signer.getAddress()));
    const hash = await this.executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      'transferFrom',
      new ContractFunctionParameterBuilder()
        .addParam({
          type: "address",
          name: "from",
          value: addresses[0]
        })
        .addParam({
          type: "address",
          name: "to",
          value: this.convertAccountIdToSolidityAddress(toAddress)
        })
        .addParam({
          type: "uint256",
          name: "nftId",
          value: serialNumber
        }),
      appConfig.constants.METAMASK_GAS_LIMIT_TRANSFER_NFT
    );
    return hash;
  }

  async associateToken(tokenId: TokenId): Promise<string | null> {
    const hash = await this.executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      'associate',
      new ContractFunctionParameterBuilder(),
      appConfig.constants.METAMASK_GAS_LIMIT_ASSOCIATE
    );
    return hash;
  }

  // Build contract execute transaction and send for signing/execution
  async executeContractFunction(
    contractId: ContractId,
    functionName: string,
    functionParameters: ContractFunctionParameterBuilder,
    gasLimit: number
  ): Promise<string | null> {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const abi = [
      `function ${functionName}(${functionParameters.buildAbiFunctionParams()})`
    ];
    // Create contract instance for the contract id
    const contract = new Contract(`0x${contractId.toSolidityAddress()}`, abi, signer);
    try {
      const txResult = await contract[functionName](
        ...functionParameters.buildEthersParams(),
        {
          gasLimit: gasLimit === -1 ? undefined : gasLimit
        }
      );
      return txResult.hash;
    } catch (error: any) {
      console.warn(error.message ? error.message : error);
      return null;
    }
  }

  disconnect() {
    alert("Please disconnect using the Metamask extension.");
  }
}

export const metamaskWallet = new MetaMaskWallet();

export const MetaMaskClient = () => {
  const { setMetamaskAccountAddress } = useContext(MetamaskContext);
  useEffect(() => {
    try {
      const provider = getProvider();
      provider.listAccounts().then(async (signers: JsonRpcSigner[]) => {
        const addresses: string[] = await Promise.all(signers.map(signer => signer.getAddress()));
        if (addresses.length !== 0) {
          setMetamaskAccountAddress(addresses[0]);
        } else {
          setMetamaskAccountAddress("");
        }
      });
      ethereum.on("accountsChanged", async (newSigners: JsonRpcSigner[]) => {
        const addresses: string[] = await Promise.all(newSigners.map(signer => signer.getAddress()));
        if (addresses.length !== 0) {
          setMetamaskAccountAddress(addresses[0]);
        } else {
          setMetamaskAccountAddress("");
        }
      });
      return () => {
        ethereum.removeAllListeners("accountsChanged");
      };
    } catch (error: any) {
      console.error(error.message ? error.message : error);
    }
  }, [setMetamaskAccountAddress]);
  return null;
};
