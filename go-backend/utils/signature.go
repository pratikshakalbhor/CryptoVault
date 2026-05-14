package utils

import (
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/crypto"
)

// RecoverSigner — Recovers the Ethereum address from an EIP-191 signature and a text message
func RecoverSigner(message string, signature string) (string, error) {
	// 1. Remove 0x from signature
	signature = strings.TrimPrefix(signature, "0x")

	// 2. Decode hex signature
	sig, err := hex.DecodeString(signature)
	if err != nil {
		return "", fmt.Errorf("failed to decode hex signature: %v", err)
	}
	if len(sig) != 65 {
		return "", fmt.Errorf("invalid signature length: expected 65 bytes, got %d", len(sig))
	}

	// 3. Fix recovery ID (MetaMask returns 27 or 28, crypto expects 0 or 1)
	if sig[64] >= 27 {
		sig[64] -= 27
	}

	// 4. Generate Ethereum signed hash
	hash := accounts.TextHash([]byte(message))

	// 5. Recover public key
	pubKey, err := crypto.SigToPub(hash, sig)
	if err != nil {
		return "", fmt.Errorf("failed to recover public key: %v", err)
	}

	// 6. Convert public key to Ethereum address
	recoveredAddress := crypto.PubkeyToAddress(*pubKey)

	return strings.ToLower(recoveredAddress.Hex()), nil
}
