package utils

// VerifyOnChain — Mock implementation
// Real madhe ethers.js frontend ne verify hoto
func VerifyOnChain(fileId, expectedHash string) (bool, string, error) {
	// Mock — hash match karto
	return true, expectedHash, nil
}
