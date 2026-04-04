package models

import "time"

// FileRecord — MongoDB madhe store hoto
type FileRecord struct {
	FileID        string    `json:"fileId"        bson:"fileId"`
	Filename      string    `json:"filename"      bson:"filename"`
	OriginalHash  string    `json:"originalHash"  bson:"originalHash"`
	EncryptedURL  string    `json:"encryptedUrl"  bson:"encryptedUrl"`
	FileSize      int64     `json:"fileSize"      bson:"fileSize"`
	WalletAddress string    `json:"walletAddress" bson:"walletAddress"`
	TxHash        string    `json:"txHash"        bson:"txHash"`
	Status        string    `json:"status"        bson:"status"`
	IsRevoked     bool      `json:"isRevoked"     bson:"isRevoked"`
	ExpiryDate    *time.Time `json:"expiryDate"    bson:"expiryDate"`
	IsExpired     bool       `json:"isExpired"      bson:"isExpired"`
	UploadedAt    time.Time `json:"uploadedAt"    bson:"uploadedAt"`
	VerifiedAt    *time.Time `json:"verifiedAt"   bson:"verifiedAt"`
}

// Stats — Dashboard sathi
type Stats struct {
	Total    int64 `json:"total"`
	Valid    int64 `json:"valid"`
	Tampered int64 `json:"tampered"`
	Revoked  int64 `json:"revoked"`
}