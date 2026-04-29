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

// FetchFileFromChain — Reads file record directly from Ethereum smart contract
func FetchFileFromChain(fileId string) (string, string, error) {
	rpcURL := os.Getenv("RPC_URL")
	contractAddr := os.Getenv("CONTRACT_ADDRESS")

	fmt.Printf("[BLOCKCHAIN] Querying Contract: %s for FileID: '%s'\n", contractAddr, fileId)

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] Dial error:", err)
		return "", "", err
	}

	// Load ABI
	abiData, err := os.ReadFile("abi/abi.json")
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

	// Prepare call
	data, err := contractABI.Pack("getFile", fileId)
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
	unpacked, err := contractABI.Unpack("getFile", result)
	if err != nil {
		fmt.Println("[BLOCKCHAIN] Unpack error:", err)
		return "", "", err
	}

	fmt.Println("🔎 Fetching from blockchain:", fileId)

	if len(unpacked) > 3 {
		hash, ok1 := unpacked[2].(string)
		cid, ok2 := unpacked[3].(string)
		if ok1 && ok2 {
			if hash == "" {
				fmt.Println("⚠️ Blockchain record is EMPTY for:", fileId)
				// Return error so the verification handler knows it's NOT_SYNCED
				return "", "", fmt.Errorf("no blockchain record found for fileId: %s", fileId)
			}
			fmt.Println("📦 Returned hash:", hash)
			return hash, cid, nil
		}
	}

	return "", "", fmt.Errorf("failed to unpack blockchain data for fileId: %s", fileId)
}

// Keep for compatibility if needed elsewhere, but refactored to use FetchFileFromChain
func VerifyOnChain(fileId, expectedHash string) (bool, string, error) {
	chainHash, _, err := FetchFileFromChain(fileId)
	if err != nil {
		return false, "", err
	}
	return strings.EqualFold(chainHash, expectedHash), chainHash, nil
}

