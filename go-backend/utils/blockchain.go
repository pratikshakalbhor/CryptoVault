package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// FetchFileFromChain — Reads file record directly from Ethereum smart contract using fileHash
func FetchFileFromChain(fileHash string) (string, string, error) {
	rpcURL := os.Getenv("RPC_URL")
	contractAddr := os.Getenv("FILE_REGISTRY_ADDRESS") // Corrected env var

	if fileHash == "" {
		return "", "", fmt.Errorf("empty file hash")
	}

	fmt.Printf("[BLOCKCHAIN] Querying FileRegistry: %s for Hash: '%s'\n", contractAddr, fileHash)

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] Dial error:", err)
		return "", "", err
	}

	// Load ABI
	abiData, err := os.ReadFile("abi/FileRegistry.json")
	if err != nil {
		fmt.Println("[BLOCKCHAIN] ABI read error:", err)
		return "", "", err
	}

	var contractABI abi.ABI
	err = json.Unmarshal(abiData, &contractABI)
	if err != nil {
		contractABI, err = abi.JSON(strings.NewReader(string(abiData)))
		if err != nil {
			fmt.Println("[BLOCKCHAIN] ABI parse error:", err)
			return "", "", err
		}
	}

	// Prepare call to verifyFile(string) returns (bool, address, uint256)
	data, err := contractABI.Pack("verifyFile", fileHash)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] Pack error:", err)
		return "", "", err
	}

	to := common.HexToAddress(contractAddr)
	msg := ethereum.CallMsg{
		To:   &to,
		Data: data,
	}

	result, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] CallContract error:", err)
		return "", "", err
	}

	// Unpack results
	unpacked, err := contractABI.Unpack("verifyFile", result)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] Unpack error:", err)
		return "", "", err
	}

	if len(unpacked) >= 1 {
		valid, ok := unpacked[0].(bool)
		if ok && valid {
			fmt.Println("✅ Blockchain confirmed registration for hash:", fileHash)
			// In the new contract, we only store the registration status.
			// If valid is true, the hash matches. CID is no longer stored on-chain.
			return fileHash, "", nil 
		}
	}

	return "", "", fmt.Errorf("no blockchain record found for hash: %s", fileHash)
}

// VerifyOnChain — Now uses fileHash for verification
func VerifyOnChain(fileHash, expectedHash string) (bool, string, error) {
	chainHash, _, err := FetchFileFromChain(fileHash)
	if err != nil {
		return false, "", err
	}
	return strings.EqualFold(chainHash, expectedHash), chainHash, nil
}
