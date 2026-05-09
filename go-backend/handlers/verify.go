package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
)

func VerifyFile(c *gin.Context) {

	// ── 1. File receive karo ──
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File missing"})
		return
	}
	defer file.Close()

	fileId := strings.TrimSpace(c.PostForm("fileId"))
	currentSize := header.Size

	// ── 2. Current hash generate karo ──
	currentHash, err := utils.GenerateSHA256(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hash generation failed"})
		return
	}
	// Normalize: remove 0x prefix for consistent comparison
	currentHash = strings.ToLower(strings.TrimSpace(currentHash))
	currentHash = strings.TrimPrefix(currentHash, "0x")

	// ── 3. MongoDB madhe record fetch karo ──
	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.FileRecord
	dbFound := true

	var dbErr error
	if fileId != "" && fileId != "undefined" {
		dbErr = col.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record)
	} else {
		// FileID nahi → hash ne search karo (with and without 0x prefix)
		dbErr = col.FindOne(ctx, bson.M{"originalHash": currentHash}).Decode(&record)
		if dbErr != nil {
			// Try with 0x prefix (legacy records)
			dbErr = col.FindOne(ctx, bson.M{"originalHash": "0x" + currentHash}).Decode(&record)
		}
		if dbErr != nil {
			// Fallback — filename ne search karo
			dbErr = col.FindOne(ctx, bson.M{"filename": header.Filename}).Decode(&record)
		}
	}

	if dbErr != nil {
		dbFound = false
	}

	dbHash := ""
	storedSize := int64(0)
	if dbFound {
		// Normalize dbHash — remove 0x prefix to match currentHash format
		dbHash = strings.ToLower(strings.TrimSpace(record.OriginalHash))
		dbHash = strings.TrimPrefix(dbHash, "0x")
		storedSize = record.FileSize
		if fileId == "" {
			fileId = record.FileID
		}
	}

	fmt.Println("=== VERIFY DEBUG ===")
	fmt.Printf("FileId:       %s\n", fileId)
	fmt.Printf("DB Hash:      %s\n", dbHash)
	fmt.Printf("Current Hash: %s\n", currentHash)
	fmt.Printf("DB Found:     %v\n", dbFound)
	fmt.Printf("DB Size:      %d\n", storedSize)
	fmt.Printf("Current Size: %d\n", currentSize)
	fmt.Println("===================")

	// ── 4. Trustless Comparison (Blockchain vs DB) ──
	var chainIpfsCID string
	var chainSigner string
	var onChainFound bool
	
	if dbFound {
		onChainFound, chainIpfsCID, chainSigner, _ = utils.VerifyOnChain(dbHash)
	}

	// ── 5. Decision Logic ──
	var status string
	var message string
	var comparison gin.H

	switch {
	case !dbFound:
		status = "NOT_REGISTERED"
		message = "🚫 File not found in registry. Upload it first."

	case onChainFound && chainIpfsCID != "" && record.IpfsCID != chainIpfsCID:
		// 🚨 DATABASE BREACH DETECTED
		status = "DATABASE_COMPROMISED"
		message = "🚨 CRITICAL: Database integrity breach! Blockchain proof differs from DB record."
		comparison = gin.H{
			"dbCID":    record.IpfsCID,
			"chainCID": chainIpfsCID,
			"breach":   true,
		}

	case currentHash == dbHash:
		// ✅ VALID
		status = "VALID"
		message = "✔ File is authentic — integrity verified"

	default:
		// ❌ TAMPERED
		status = "TAMPERED"
		message = "❌ File has been modified — tampering detected"

		sizeChanged := currentSize != storedSize
		var auditMsg string
		if sizeChanged {
			origMB := float64(storedSize) / 1048576
			currMB := float64(currentSize) / 1048576
			auditMsg = fmt.Sprintf("File size changed from %.2f MB to %.2f MB", origMB, currMB)
		} else {
			auditMsg = "File content modified (same size, different hash)"
		}

		comparison = gin.H{
			"sizeMatch":        !sizeChanged,
			"originalFileSize": storedSize,
			"currentFileSize":  currentSize,
			"auditMessage":     auditMsg,
		}
	}

	// ── 6. MongoDB status update ──
	if dbFound {
		col.UpdateOne(ctx,
			bson.M{"fileId": record.FileID},
			bson.M{"$set": bson.M{
				"status":     strings.ToLower(status),
				"verifiedAt": time.Now(),
			}},
		)

		if status == "VALID" {
			NotifyVerifyValid(record.WalletAddress, record.Filename, fileId)
		} else if status == "TAMPERED" {
			NotifyTamperDetected(record.WalletAddress, record.Filename, fileId)
		}
	}

	// ── 7. Response ──
	resp := gin.H{
		"success":        true,
		"status":         status,
		"isMatch":        status == "VALID",
		"dbVerified":     dbFound && currentHash == dbHash,
		"chainVerified":  onChainFound,
		"currentHash":    currentHash,
		"originalHash":   dbHash,
		"blockchainCID":  chainIpfsCID,
		"blockchainSigner": chainSigner,
		"message":        message,
		"fileId":         fileId,
		"filename":       record.Filename,
		"txHash":         record.TxHash,
		"walletAddress":  record.WalletAddress,
		"uploadedAt":     record.UploadedAt,
		"restoreUrl":     record.EncryptedURL,
		"ipfsCID":        record.IpfsCID,
	}

	if comparison != nil {
		resp["comparison"] = comparison
	}

	c.JSON(http.StatusOK, resp)
}
