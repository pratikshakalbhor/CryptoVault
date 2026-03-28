package utils

import (
	"crypto/sha256"
	"fmt"
	"io"
	"mime/multipart"
)

// GenerateSHA256 — File cha SHA-256 hash generate karto
func GenerateSHA256(file multipart.File) (string, error) {
	hasher := sha256.New()

	_, err := io.Copy(hasher, file)
	if err != nil {
		return "", err
	}

	hash := fmt.Sprintf("%x", hasher.Sum(nil))
	return hash, nil
}

// GenerateSHA256FromBytes — Bytes kadun hash generate karto
func GenerateSHA256FromBytes(data []byte) string {
	hasher := sha256.New()
	hasher.Write(data)
	return fmt.Sprintf("%x", hasher.Sum(nil))
}

// MockTxHash — Blockchain TX hash (mock)
func MockTxHash(fileHash string) string {
	hasher := sha256.New()
	hasher.Write([]byte(fileHash))
	return "0x" + fmt.Sprintf("%x", hasher.Sum(nil))[:40]
}