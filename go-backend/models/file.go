package models

import "time"

type FileRecord struct {
	FileID        string     `json:"fileId"        bson:"fileId"`
	Filename      string     `json:"filename"      bson:"filename"`
	OriginalHash  string     `json:"originalHash"  bson:"originalHash"`
	EncryptedURL  string     `json:"encryptedUrl"  bson:"encryptedUrl"`
	IpfsCID       string     `json:"ipfsCID"       bson:"ipfsCID"`
	BackupPath    string     `json:"backupPath"    bson:"backupPath"`
	FileSize      int64      `json:"fileSize"      bson:"fileSize"`
	MimeType      string     `json:"mimeType"      bson:"mimeType"`
	WalletAddress string     `json:"walletAddress" bson:"walletAddress"`
	TxHash        string     `json:"txHash"        bson:"txHash"`
	BlockNumber   uint64     `json:"blockNumber"   bson:"blockNumber"`
	Status        string     `json:"status"        bson:"status"`
	IsRevoked     bool       `json:"isRevoked"     bson:"isRevoked"`
	IsTrashed     bool       `json:"isTrashed"     bson:"isTrashed"`
	TrashedAt     *time.Time `json:"trashedAt"     bson:"trashedAt"`
	Visibility    string     `json:"visibility"    bson:"visibility"`
	SharedWith    []string   `json:"sharedWith"    bson:"sharedWith"`
	ExpiryDate    *time.Time `json:"expiryDate"    bson:"expiryDate"`
	ParentFileID  string     `json:"parentFileId"  bson:"parentFileId"`
	Version       int        `json:"version"       bson:"version"`
	VersionNote   string     `json:"versionNote"   bson:"versionNote"`
	PublicID      string     `json:"publicId"      bson:"publicId"`
	UploadedAt    time.Time  `json:"uploadedAt"    bson:"uploadedAt"`
	VerifiedAt    *time.Time `json:"verifiedAt"    bson:"verifiedAt"`
	UpdatedAt     *time.Time `json:"updatedAt"     bson:"updatedAt"`
}

type VersionRecord struct {
	Version     int       `json:"version"     bson:"version"`
	Hash        string    `json:"hash"        bson:"hash"`
	Timestamp   time.Time `json:"timestamp"   bson:"timestamp"`
	StoragePath string    `json:"storagePath" bson:"storagePath"`
	TxHash      string    `json:"txHash"      bson:"txHash"`
}

type Stats struct {
	Total    int64 `json:"total"`
	Valid    int64 `json:"valid"`
	Tampered int64 `json:"tampered"`
	Revoked  int64 `json:"revoked"`
	Pending  int64 `json:"pending"`
}
