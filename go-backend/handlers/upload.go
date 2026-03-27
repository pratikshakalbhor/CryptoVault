package handlers

import (
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
)

func UploadFile(c *gin.Context) {
	// Step 1 — File receive karo
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File nahi mila"})
		return
	}
	defer file.Close()

	wallet := c.Request.FormValue("walletAddress")
	if wallet == "" {
		wallet = "unknown"
	}

	// Step 2 — SHA-256 hash generate karo
	fileHash, err := utils.GenerateSHA256(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hash generate error"})
		return
	}

	// Step 3 — Mock blockchain TX hash
	txHash := utils.MockTxHash(fileHash)

	// Step 4 — Unique File ID banvao
	fileID := fmt.Sprintf("FILE-%s%d",
		randomString(6),
		time.Now().Unix(),
	)

	// Step 5 — MongoDB madhe save karo
	record := models.FileRecord{
		FileID:        fileID,
		Filename:      header.Filename,
		OriginalHash:  fileHash,
		EncryptedURL:  fmt.Sprintf("cloudinary://encrypted/%s", header.Filename),
		FileSize:      header.Size,
		WalletAddress: wallet,
		TxHash:        txHash,
		Status:        "valid",
		IsRevoked:     false,
		UploadedAt:    time.Now(),
	}

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, record)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MongoDB save error"})
		return
	}

	// Step 6 — Response
	c.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"message":   "File sealed on blockchain! ",
		"fileId":    fileID,
		"filename":  header.Filename,
		"fileHash":  fileHash,
		"txHash":    txHash,
		"fileSize":  header.Size,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func randomString(n int) string {
	letters := []rune("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	s := make([]rune, n)
	for i := range s {
		s[i] = letters[rand.Intn(len(letters))]
	}
	return string(s)
}
