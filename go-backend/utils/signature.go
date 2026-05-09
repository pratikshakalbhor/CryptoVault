package utils

import (
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
)

// RecoverSigner — Recovers the Ethereum address from an EIP-191 signature and a 32-byte message hash
func RecoverSigner(hashHex string, signature string) (string, error) {
	// 1. Decode the hex hash into bytes (should be 32 bytes)
	hashBytes, err := hexutil.Decode(hashHex)
	if err != nil {
		return "", fmt.Errorf("failed to decode hash: %v", err)
	}
	if len(hashBytes) != 32 {
		return "", fmt.Errorf("invalid hash length: expected 32 bytes, got %d", len(hashBytes))
	}

	// 2. Prepare the EIP-191 prefixed message hash (\x19Ethereum Signed Message:\n32)
	prefix := "\x19Ethereum Signed Message:\n32"
	data := append([]byte(prefix), hashBytes...)
	msgHash := crypto.Keccak256(data)

	// 3. Clean signature
	sig, err := hexutil.Decode(signature)
	if err != nil {
		return "", err
	}
	if len(sig) != 65 {
		return "", fmt.Errorf("invalid signature length: %d", len(sig))
	}

	// 4. Adjust V value (Ethereum standard is 27/28, but crypto package expects 0/1)
	if sig[64] == 27 || sig[64] == 28 {
		sig[64] -= 27
	}

	// 5. Recover public key
	pubKey, err := crypto.SigToPub(msgHash, sig)
	if err != nil {
		return "", err
	}

	// 6. Get address
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)
	return strings.ToLower(recoveredAddr.Hex()), nil
}
