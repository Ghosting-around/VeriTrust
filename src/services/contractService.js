import { ethers } from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const CONTRACT_ABI = [
  "function admin() view returns (address)",
  "function institutions(address) view returns (string,bool)",
  "function registerInstitution(address,string)",
  "function issueCredential(address,bytes32)",
  "function grantConsent(address)",
  "function revokeConsent(address)",
  "function hasConsent(address,address) view returns (bool)",
  "function getCredentialCount(address) view returns (uint256)",
  "function verifyCredential(address,uint256) view returns (bytes32,string,address,bool)"
];

export const formatHash = (str) => {
  if (!str) return str;
  return str.slice(0, 6) + "..." + str.slice(-4);
};

export const connectWalletService = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed. Please install MetaMask.");
  }

  // Request to switch to Sepolia network
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }], // Sepolia
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      throw new Error("Sepolia network not found. Please add it to MetaMask.");
    }
    throw switchError;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return {
    provider,
    contract,
    address,
    chainId: network.chainId,
  };
};

export const registerInstitutionService = async (contract, instAddress, instName) => {
  if (!ethers.isAddress(instAddress)) {
    throw new Error("Invalid institution address format");
  }
  const tx = await contract.registerInstitution(instAddress, instName);
  return await tx.wait();
};

export const checkIsInstitution = async (contract, walletAddress) => {
  const inst = await contract.institutions(walletAddress);
  return inst[1]; // returns boolean: isRegistered
};

export const issueCredentialService = async (contract, credentialRecipient, credentialName) => {
  if (!ethers.isAddress(credentialRecipient)) {
    throw new Error("Invalid recipient address format");
  }
  const hash = ethers.keccak256(ethers.toUtf8Bytes(credentialName));
  const tx = await contract.issueCredential(credentialRecipient, hash);
  const receipt = await tx.wait();
  return { receipt, hash };
};

export const grantConsentService = async (contract, targetVerifierAddress) => {
  if (!ethers.isAddress(targetVerifierAddress)) {
    throw new Error("Invalid verifier address format");
  }
  const tx = await contract.grantConsent(targetVerifierAddress);
  return await tx.wait();
};

export const revokeConsentService = async (contract, targetVerifierAddress) => {
  if (!ethers.isAddress(targetVerifierAddress)) {
    throw new Error("Invalid verifier address format");
  }
  const tx = await contract.revokeConsent(targetVerifierAddress);
  return await tx.wait();
};

export const getCredentialsCountService = async (contract, targetAddr) => {
  const count = await contract.getCredentialCount(targetAddr);
  return Number(count);
};

export const verifySingleCredentialService = async (contract, targetAddr, index) => {
  return await contract.verifyCredential(targetAddr, index);
};

export const checkConsentService = async (contract, targetAddr, viewerAddr) => {
  return await contract.hasConsent(targetAddr, viewerAddr);
};
