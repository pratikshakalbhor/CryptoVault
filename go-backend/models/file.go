package models

import "time"

// VersionRecord — specific version details
type VersionRecord struct {
	VersionNumber int       `json:"versionNumber" bson:"versionNumber"`
	Hash          string    `json:"hash"          bson:"hash"`
	TxHash        string    `json:"txHash"        bson:"txHash"`
	Timestamp     time.Time `json:"timestamp"     bson:"timestamp"`
	Note          string    `json:"note"          bson:"note"`
}

// FileRecord — MongoDB madhe store hoto
type FileRecord struct {
	FileID        string          `json:"fileId"        bson:"fileId"`
	PublicID      string          `json:"publicId"      bson:"publicId"` // Navin — public verification sathi
	Filename      string          `json:"filename"      bson:"filename"`
	OriginalHash  string          `json:"originalHash"  bson:"originalHash"`
	EncryptedURL  string          `json:"encryptedUrl"  bson:"encryptedUrl"`
	FileSize      int64           `json:"fileSize"      bson:"fileSize"`
	WalletAddress string          `json:"walletAddress" bson:"walletAddress"`
	TxHash        string          `json:"txHash"        bson:"txHash"`
	Status        string          `json:"status"        bson:"status"`
	IsRevoked     bool            `json:"isRevoked"     bson:"isRevoked"`
	ExpiryDate    *time.Time      `json:"expiryDate"    bson:"expiryDate"`
	IsExpired     bool            `json:"isExpired"     bson:"isExpired"`
	UploadedAt    time.Time       `json:"uploadedAt"    bson:"uploadedAt"`
	VerifiedAt    *time.Time      `json:"verifiedAt"    bson:"verifiedAt"`
	Version       int             `json:"version"       bson:"version"`
	Versions      []VersionRecord `json:"versions"      bson:"versions"` // Audit Trail sathi
	Visibility    string          `json:"visibility"    bson:"visibility"`    // private, public, shared
	SharedWith    []string        `json:"sharedWith"    bson:"sharedWith"`    // wallet addresses
	GasUsed       string          `json:"gasUsed"       bson:"gasUsed"`
	BlockNumber   string          `json:"blockNumber"   bson:"blockNumber"`
}

// Stats — Dashboard sathi
type Stats struct {
	Total    int64 `json:"total"`
	Valid    int64 `json:"valid"`
	Tampered int64 `json:"tampered"`
	Revoked  int64 `json:"revoked"`
}