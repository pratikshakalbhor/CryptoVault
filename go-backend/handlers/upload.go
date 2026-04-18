package handlers

import (
	"context"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
)

func UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File not found"})
		return
	}
	defer file.Close()

	wallet := c.PostForm("walletAddress")
	parentFileId := c.PostForm("parentFileId")
	versionNote := c.PostForm("versionNote")

	// Read file
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File read error"})
		return
	}

	// Hash
	fileHash := utils.GenerateSHA256FromBytes(fileBytes)

	// Encrypt
	encryptedBytes, err := utils.EncryptAES(fileBytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed"})
		return
	}

	// Upload to IPFS
	ipfsURL, err := utils.UploadToPinata(encryptedBytes, header.Filename)
	if err != nil {
		ipfsURL = "mock_url"
	}

	// Mock blockchain TX
	txHash := utils.MockTxHash(fileHash)

	fileID := fmt.Sprintf("FILE-%s%d", randomString(6), time.Now().Unix())
	publicID := randomString(10)

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Expiry
	expiryStr := c.PostForm("expiryDate")
	var expiryDate *time.Time
	if expiryStr != "" {
		t, _ := time.Parse("2006-01-02", expiryStr)
		expiryDate = &t
	}

	// VERSION LOGIC FIX
	if parentFileId != "" {
		var existing models.FileRecord
		err := collection.FindOne(ctx, bson.M{"fileId": parentFileId}).Decode(&existing)

		if err == nil {
			newVersion := existing.Version + 1

			_, _ = collection.UpdateOne(ctx,
				bson.M{"fileId": parentFileId},
				bson.M{
					"$set": bson.M{
						"originalHash": fileHash,
						"txHash":       txHash,
						"version":      newVersion,
						"uploadedAt":   time.Now(),
					},
					"$push": bson.M{
						"versions": models.VersionRecord{
							VersionNumber: newVersion,
							Hash:          fileHash,
							TxHash:        txHash,
							Timestamp:     time.Now(),
							Note:          versionNote,
						},
					},
				})

			fileID = parentFileId
			publicID = existing.PublicID
		}
	} else {
		// New file
		record := models.FileRecord{
			FileID:        fileID,
			PublicID:      publicID,
			Filename:      header.Filename,
			OriginalHash:  fileHash,
			EncryptedURL:  ipfsURL,
			FileSize:      header.Size,
			WalletAddress: wallet,
			TxHash:        txHash,
			Status:        "valid",
			ExpiryDate:    expiryDate,
			UploadedAt:    time.Now(),
			Version:       1,
		}

		_, err = collection.InsertOne(ctx, record)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB save failed"})
			return
		}
	}

	//  FINAL RESPONSE FIX
	c.JSON(http.StatusOK, gin.H{
		"fileId":   fileID,
		"publicId": publicID,
		"filename": header.Filename,
		"fileHash": fileHash,
		"fileSize": header.Size, //  important
		"txHash":   txHash,
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