package handlers

import (
	"context"
	"log"
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
	// Step 1 — Receive File & FileID
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File not found in request"})
		return
	}
	defer file.Close()

	fileId := c.PostForm("fileId")

	// Step 2 — Generate current hash (Current Fingerprint)
	currentHash, err := utils.GenerateSHA256(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hash generation failed"})
		return
	}

	log.Printf("[VERIFY] Request received for ID: %s. Computed Hash: %s", fileId, currentHash)

	// Step 3 — Search MongoDB (Ledger Fingerprint)
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.FileRecord
	var dbErr error
	if fileId != "" && fileId != "undefined" {
		dbErr = collection.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record)
	} else {
		dbErr = collection.FindOne(ctx, bson.M{"originalHash": currentHash}).Decode(&record)
	}

	if dbErr != nil {
		log.Printf("[VERIFY] Record not found for hash: %s", currentHash)
		c.JSON(http.StatusOK, gin.H{
			"success":     false,
			"status":      "TAMPERED",
			"message":     "Fingerprint not found in our ledger.",
			"currentHash": currentHash,
		})
		return
	}

	// Step 4 — Fetch from Blockchain (Mock)
	blockchainHash := strings.ToLower(strings.TrimSpace(record.OriginalHash))
	
	// Triple-Check Logic
	dbHash := strings.ToLower(strings.TrimSpace(record.OriginalHash))
	currentHash = strings.ToLower(strings.TrimSpace(currentHash))
	
	// Check all three (since blockchainHash = dbHash here, it's simplified)
	hashesMatch := (currentHash == dbHash) && (currentHash == blockchainHash)
	
	finalStatus := "TAMPERED"
	if hashesMatch {
		finalStatus = "SAFE"
	}

	// Audit Trail Update
	collection.UpdateOne(ctx,
		bson.M{"fileId": record.FileID},
		bson.M{"$set": bson.M{
			"status":     strings.ToLower(finalStatus),
			"verifiedAt": time.Now(),
		}},
	)

	// Final Response Structure for Frontend Comparison Card
	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"status":         finalStatus,
		"isMatch":        hashesMatch,
		"fileId":         record.FileID,
		"filename":       record.Filename,
		"currentHash":    currentHash,
		"originalHash":   dbHash,
		"blockchainHash": blockchainHash,
		"txHash":         record.TxHash,
		"walletAddress":  record.WalletAddress,
		"uploadedAt":     record.UploadedAt,
		"isRevoked":      record.IsRevoked,
	})
}