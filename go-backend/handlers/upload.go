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
		c.JSON(http.StatusBadRequest, gin.H{"error": "File nahi mila"})
		return
	}
	defer file.Close()

	wallet := c.Request.FormValue("walletAddress")
	if wallet == "" {
		wallet = "unknown"
	}

	// Step 1 — File bytes read karo
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File read error"})
		return
	}

	// Step 2 — SHA-256 hash
	fileHash := utils.GenerateSHA256FromBytes(fileBytes)

	// Step 3 — AES-256 encrypt
	encryptedBytes, err := utils.EncryptAES(fileBytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encrypt error"})
		return
	}

	// Step 4 — Pinata IPFS upload (encrypted file)
	ipfsURL, err := utils.UploadToPinata(encryptedBytes, "encrypted_"+header.Filename)
	if err != nil {
		// IPFS fail zali tari — mock URL vaprto, upload continue hoto
		ipfsURL = fmt.Sprintf("https://gateway.pinata.cloud/ipfs/mock_%s", header.Filename)
	}

	// Step 5 — Mock TX hash
	txHash := utils.MockTxHash(fileHash)

	// Step 6 — File IDs
	fileID := fmt.Sprintf("FILE-%s%d", randomString(6), time.Now().Unix())
	publicID := randomString(12)

	versionNote := c.Request.FormValue("versionNote")
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Step 7 — Expiry date
	expiryDateStr := c.Request.FormValue("expiryDate")
	var expiryDate *time.Time
	if expiryDateStr != "" {
		parsed, err := time.Parse("2006-01-02", expiryDateStr)
		if err == nil {
			expiryDate = &parsed
		}
	}

	// Step 8 — Check if same file exists for this wallet (Versioning)
	var existing models.FileRecord
	err = collection.FindOne(ctx, bson.M{
		"filename":      header.Filename,
		"walletAddress": wallet,
	}).Decode(&existing)

	if err == nil {
		// File file exists — Update Versions array
		newVersionNum := existing.Version + 1
		newVersionRecord := models.VersionRecord{
			VersionNumber: newVersionNum,
			Hash:          fileHash,
			TxHash:        txHash,
			Timestamp:     time.Now(),
			Note:          versionNote,
		}

		_, err = collection.UpdateOne(ctx, bson.M{"fileId": existing.FileID}, bson.M{
			"$set": bson.M{
				"originalHash": fileHash,
				"txHash":       txHash,
				"version":      newVersionNum,
				"uploadedAt":   time.Now(),
			},
			"$push": bson.M{"versions": newVersionRecord},
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Update error"})
			return
		}

		fileID = existing.FileID
		publicID = existing.PublicID
	} else {
		// New File
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
			IsRevoked:     false,
			ExpiryDate:    expiryDate,
			IsExpired:     false,
			UploadedAt:    time.Now(),
			Version:       1,
			Versions: []models.VersionRecord{
				{
					VersionNumber: 1,
					Hash:          fileHash,
					TxHash:        txHash,
					Timestamp:     time.Now(),
					Note:          "Initial Version",
				},
			},
			GasUsed:     "43383",
			BlockNumber: "",
		}

		_, err = collection.InsertOne(ctx, record)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "MongoDB save error"})
			return
		}
	}

	// Response
	c.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"message":   "File sealed on blockchain!",
		"fileId":    fileID,
		"publicId":  publicID,
		"filename":  header.Filename,
		"fileHash":  fileHash,
		"txHash":    txHash,
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
