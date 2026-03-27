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
	// Step 1 — File aani FileID receive karo
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File nahi mila"})
		return
	}
	defer file.Close()

	fileID := c.Request.FormValue("fileId")
	if fileID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID required"})
		return
	}

	// Step 2 — MongoDB madhe original record fetch karo
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err = collection.FindOne(ctx, bson.M{"fileId": fileID}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File record nahi mila"})
		return
	}

	if record.IsRevoked {
		c.JSON(http.StatusBadRequest, gin.H{"error": "He file revoke zali aahe"})
		return
	}

	// Step 3 — Current hash generate karo
	currentHash, err := utils.GenerateSHA256(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hash generate error"})
		return
	}

	// Step 4 — Compare karo
	isMatch := currentHash == record.OriginalHash
	status := "valid"
	message := "File is VALID "

	if !isMatch {
		status = "tampered"
		message = "TAMPER DETECTED "
	}

	// Step 5 — MongoDB status update karo
	now := time.Now()
	collection.UpdateOne(ctx,
		bson.M{"fileId": fileID},
		bson.M{"$set": bson.M{
			"status":     status,
			"verifiedAt": now,
		}},
	)

	// Step 6 — Response
	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"fileId":       fileID,
		"filename":     record.Filename,
		"isMatch":      isMatch,
		"status":       status,
		"originalHash": record.OriginalHash,
		"currentHash":  currentHash,
		"txHash":       record.TxHash,
		"verifiedAt":   now.Format(time.RFC3339),
		"message":      message,
	})
}