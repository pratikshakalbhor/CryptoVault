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
	currentHash = strings.ToLower(strings.TrimSpace(currentHash))

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
		// FileID nahi → hash ne search karo
		dbErr = col.FindOne(ctx, bson.M{"originalHash": currentHash}).Decode(&record)
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
		dbHash = strings.ToLower(strings.TrimSpace(record.OriginalHash))
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

	// ── 4. Decision Logic ──
	// ✅ KEY RULE: DB hash match = VALID (blockchain optional!)
	var status string
	var message string
	var comparison gin.H

	switch {
	case !dbFound:
		status = "NOT_REGISTERED"
		message = "🚫 File not found in registry. Upload it first."

	case currentHash == dbHash:
		// ✅ VALID — same hash, same file!
		status = "VALID"
		message = "✔ File is authentic — integrity verified"

	default:
		// ❌ TAMPERED — hash different
		status = "TAMPERED"
		message = "❌ File has been modified — tampering detected"

		// Audit comparison — size check
		sizeChanged := currentSize != storedSize
		var auditMsg string
		if sizeChanged {
			origMB := float64(storedSize) / 1048576
			currMB := float64(currentSize) / 1048576
			auditMsg = fmt.Sprintf("File size changed from %.2f MB to %.2f MB", origMB, currMB)
		} else {
			auditMsg = "File content modified (same size, different hash — possible steganography or metadata change)"
		}

		comparison = gin.H{
			"sizeMatch":        !sizeChanged,
			"originalFileSize": storedSize,
			"currentFileSize":  currentSize,
			"auditMessage":     auditMsg,
		}
	}

	// ── 5. MongoDB status update karo ──
	now := time.Now()
	if dbFound {
		col.UpdateOne(ctx,
			bson.M{"fileId": record.FileID},
			bson.M{"$set": bson.M{
				"status":     strings.ToLower(status),
				"verifiedAt": now,
			}},
		)
	}

	// ── 6. Notification create karo ──
	if dbFound {
		notifCol := database.GetCollection("notifications")
		notifType := "success"
		notifMsg := fmt.Sprintf("✅ File '%s' verified — VALID", record.Filename)

		if status == "TAMPERED" {
			notifType = "error"
			notifMsg = fmt.Sprintf("⚠️ TAMPER DETECTED — '%s' has been modified!", record.Filename)
		}

		notifCol.InsertOne(ctx, bson.M{
			"user":      record.WalletAddress,
			"message":   notifMsg,
			"type":      notifType,
			"fileId":    record.FileID,
			"read":      false,
			"createdAt": now,
		})
	}

	// ── 7. Response ──
	resp := gin.H{
		"success":        true,
		"status":         status,
		"isMatch":        status == "VALID",
		"dbVerified":     dbFound && currentHash == dbHash,
		"chainVerified":  false, // blockchain check optional
		"currentHash":    currentHash,
		"originalHash":   dbHash,
		"blockchainHash": "", // FetchFileFromChain optional
		"message":        message,
		"fileId":         fileId,
		"filename":       record.Filename,
		"txHash":         record.TxHash,
		"walletAddress":  record.WalletAddress,
		"uploadedAt":     record.UploadedAt,
		"mimeType":       record.MimeType,
		"fileSize":       record.FileSize,
		// Restore sathi
		"restoreUrl": record.EncryptedURL,
		"ipfsCID":    record.IpfsCID,
	}

	if comparison != nil {
		resp["comparison"] = comparison
	}

	c.JSON(http.StatusOK, resp)
}
