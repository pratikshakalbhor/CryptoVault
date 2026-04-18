package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
)

func VerifyFile(c *gin.Context) {

	// Step 1 — File receive karo
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File nahi mila"})
		return
	}
	defer file.Close()

	// Step 2 — New hash generate karo
	newHash, err := utils.GenerateSHA256(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hash generate error"})
		return
	}

	// Step 3 — MongoDB madhe hash search karo — FileID nahi lagat!
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err = collection.FindOne(ctx, bson.M{"originalHash": newHash}).Decode(&record)

	if err != nil {
		// Hash nahi mila = TAMPERED
		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"status":      "tampered",
			"isMatch":     false,
			"message":     "⚠️ TAMPER DETECTED — No matching hash found in registry",
			"currentHash": newHash,
			"originalHash": "",
		})
		return
	}

	// Revoked check
	if record.IsRevoked {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"status":  "revoked",
			"isMatch": false,
			"message": "This file has been revoked",
			"fileId":  record.FileID,
		})
		return
	}

	// Step 4 — Hash mila = VALID
	now := time.Now()

	// MongoDB status update karo
	collection.UpdateOne(ctx,
		bson.M{"originalHash": newHash},
		bson.M{"$set": bson.M{
			"status":     "valid",
			"verifiedAt": now,
		}},
	)

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"status":       "valid",
		"isMatch":      true,
		"message":      "✅ File is VALID — Integrity verified",
		"fileId":       record.FileID,
		"filename":     record.Filename,
		"originalHash": record.OriginalHash,
		"currentHash":  newHash,
		"txHash":       record.TxHash,
		"walletAddress": record.WalletAddress,
		"uploadedAt":   record.UploadedAt,
		"verifiedAt":   now.Format(time.RFC3339),
	})
}