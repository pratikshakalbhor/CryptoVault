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
func FetchFileFromChain(fileHash string) (string, string, string, error) {
	rpcURL := os.Getenv("RPC_URL")
	contractAddr := os.Getenv("FILE_REGISTRY_ADDRESS")

	if fileHash == "" {
		return "", "", "", fmt.Errorf("empty file hash")
	}

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return "", "", "", err
	}

	abiData, err := os.ReadFile("abi/FileRegistry.json")
	if err != nil {
		return "", "", "", err
	}

	var contractABI abi.ABI
	err = json.Unmarshal(abiData, &contractABI)
	if err != nil {
		contractABI, err = abi.JSON(strings.NewReader(string(abiData)))
		if err != nil {
			return "", "", "", err
		}
	}

	data, err := contractABI.Pack("verifyFile", fileHash)
	if err != nil {
		return "", "", "", err
	}

	to := common.HexToAddress(contractAddr)
	msg := ethereum.CallMsg{
		To:   &to,
		Data: data,
	}

	result, err := client.CallContract(context.Background(), msg, nil)
	if err != nil {
		return "", "", "", err
	}

	unpacked, err := contractABI.Unpack("verifyFile", result)
	if err != nil {
		return "", "", "", err
	}

	// Unpacked: [bool valid, address owner, string ipfsCID, address signer, uint256 timestamp]
	if len(unpacked) >= 4 {
		valid, ok := unpacked[0].(bool)
		if ok && valid {
			ipfsCID, _ := unpacked[2].(string)
			signer, _ := unpacked[3].(common.Address)
			return fileHash, ipfsCID, strings.ToLower(signer.Hex()), nil
		}
	}

	return "", "", "", fmt.Errorf("no blockchain record found for hash: %s", fileHash)
}

// VerifyOnChain — Now uses fileHash for verification and returns CID for trustless comparison
func VerifyOnChain(fileHash string) (bool, string, string, error) {
	_, ipfsCID, signer, err := FetchFileFromChain(fileHash)
	if err != nil {
		return false, "", "", err
	}
	return true, ipfsCID, signer, nil
}
