package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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

	wallet := strings.ToLower(c.PostForm("wallet"))
	signature := c.PostForm("signature")
	message := c.PostForm("message")
	clientFileHash := c.PostForm("fileHash")

	if wallet == "" {
		wallet = strings.ToLower(c.Request.FormValue("walletAddress"))
	}
	parentFileId := c.PostForm("parentFileId")

	if wallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address required"})
		return
	}

	// Read file bytes for hashing
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		log.Printf("❌ Failed to read uploaded file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File read error"})
		return
	}

	// Hash (stored WITHOUT 0x prefix for consistency)
	fileHash := strings.ToLower(utils.GenerateSHA256FromBytes(fileBytes))

	// If client provided a hash, we can verify it matches our calculation
	if clientFileHash != "" && !strings.EqualFold(strings.TrimPrefix(clientFileHash, "0x"), fileHash) {
		log.Printf("❌ Hash mismatch: Client(%s) != Server(%s)", clientFileHash, fileHash)
		c.JSON(http.StatusBadRequest, gin.H{"error": "File integrity check failed (hash mismatch)"})
		return
	}

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 🛡️ DUPLICATE PREVENTION (Early Check) — check both with and without 0x prefix
	var existing models.FileRecord
	if err := collection.FindOne(ctx, bson.M{"$or": []bson.M{
		{"originalHash": fileHash},
		{"originalHash": "0x" + fileHash},
	}}).Decode(&existing); err == nil {
		log.Printf("⚠️ File already in DB: %s", existing.FileID)
		c.JSON(http.StatusOK, gin.H{
			"success":  true,
			"fileId":   existing.FileID,
			"publicId": existing.PublicID,
			"fileHash": fileHash,
			"filename": existing.Filename,
			"txHash":   existing.TxHash,
			"ipfsCID":  existing.IpfsCID,
			"message":  "File already registered",
			"existing": true,
		})
		return
	}

	// 🛡️ SIGNATURE VERIFICATION
	if signature != "" {
		if message == "" {
			// Fallback if message not provided, but we should encourage message
			message = fmt.Sprintf("Verify file ownership: %s", clientFileHash)
		}

		recoveredAddr, err := utils.RecoverSigner(message, signature)
		if err != nil {
			log.Printf("❌ Signature recovery failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid digital signature",
			})
			return
		}

		if !strings.EqualFold(recoveredAddr, wallet) {
			log.Printf("❌ Signer mismatch: %s != %s", recoveredAddr, wallet)
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid digital signature",
			})
			return
		}
		log.Printf("✅ Digital Signature Verified for: %s", recoveredAddr)
	}

	// Encrypt
	encryptedBytes, err := utils.EncryptAES(fileBytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Encryption failed"})
		return
	}

	// Upload to IPFS
	ipfsURL, ipfsCID, err := utils.UploadToPinata(encryptedBytes, header.Filename)
	if err != nil {
		log.Printf("⚠️ Pinata upload failed: %v — using fallback", err)
		ipfsURL = ""
		ipfsCID = ""
	}
	log.Printf("📦 IPFS Upload — URL: %s | CID: %s", ipfsURL, ipfsCID)

	// Accept optional override from frontend (Cloudinary or other storage)
	if frontendUrl := c.PostForm("encryptedUrl"); frontendUrl != "" {
		ipfsURL = frontendUrl
	} else if cloudUrl := c.PostForm("cloudinaryUrl"); cloudUrl != "" {
		ipfsURL = cloudUrl
	}

	// Real blockchain TX will be stored after frontend confirmation
	txHash := ""

	fileID := fmt.Sprintf("FILE-%d", time.Now().Unix())
	publicID := randomString(10)

	// Expiry — try multiple formats (ISO 8601 from frontend, or date-only)
	expiryStr := c.PostForm("expiryDate")
	var expiryDate *time.Time
	if expiryStr != "" {
		// Try ISO 8601 first (from frontend datetime-local: "2026-05-10T10:30:00.000Z")
		if t, e := time.Parse(time.RFC3339, expiryStr); e == nil {
			expiryDate = &t
		} else if t, e := time.Parse("2006-01-02T15:04:05", expiryStr); e == nil {
			expiryDate = &t
		} else if t, e := time.Parse("2006-01-02", expiryStr); e == nil {
			expiryDate = &t
		} else {
			log.Printf("⚠️ Could not parse expiry date: %s", expiryStr)
		}
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
						"ipfsCID":      ipfsCID,
						"encryptedURL": ipfsURL,
						"txHash":       txHash,
						"fileSize":     header.Size,
						"mimeType":     header.Header.Get("Content-Type"),
						"version":      newVersion,
						"uploadedAt":   time.Now(),
					},
					"$push": bson.M{
						"versions": models.VersionRecord{
							Version:   newVersion,
							Hash:      ipfsCID,
							TxHash:    txHash,
							Timestamp: time.Now(),
						},
					},
				})

			fileID = parentFileId
			publicID = existing.PublicID
		}
	} else {

		// 🛡️ TX HASH VALIDATION (Requirement #4)
		// Try to get txHash from frontend first, else use mock
		clientTxHash := c.PostForm("txHash")
		if clientTxHash != "" {
			if !strings.HasPrefix(clientTxHash, "0x") || len(clientTxHash) != 66 {
				log.Printf("❌ Invalid txHash provided: %s", clientTxHash)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction hash format"})
				return
			}
			txHash = clientTxHash
		}

		// ── SAVE BACKUP ──
		backupDir := "./vault"
		if _, err := os.Stat(backupDir); os.IsNotExist(err) {
			os.MkdirAll(backupDir, 0755)
		}
		
		cleanFilename := strings.ReplaceAll(header.Filename, " ", "_")
		backupPath := filepath.Join(backupDir, fileID+"_"+cleanFilename)
		
		err = os.WriteFile(backupPath, fileBytes, 0644)
		if err != nil {
			log.Printf("⚠️ Backup save failed: %v", err)
		} else {
			log.Printf("📥 Backup saved to: %s", backupPath)
		}

		// New file
		record := models.FileRecord{
			FileID:        fileID,
			PublicID:      publicID,
			Filename:      header.Filename,
			FileExtension: filepath.Ext(header.Filename),
			OriginalHash:  fileHash,
			EncryptedURL:  ipfsURL,
			IpfsCID:       ipfsCID,
			FileSize:      header.Size,
			MimeType:      header.Header.Get("Content-Type"),
			WalletAddress: wallet,
			TxHash:        txHash,
			Status:        "valid",
			BackupPath:    backupPath,
			VaultPath:     backupPath,
			ExpiryDate:    expiryDate,
			UploadedAt:    time.Now(),
			Version:       1,
		}
		log.Printf("💾 Saving record — fileId: %s | hash: %s | ipfs: %s | url: %s",
			record.FileID, record.OriginalHash, record.IpfsCID, record.EncryptedURL)

		result, err := collection.InsertOne(ctx, record)
		if err != nil {
			log.Printf("❌ MongoDB INSERT ERROR: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Database save failed: " + err.Error(),
			})
			return
		}
		log.Printf("✅ MongoDB INSERT SUCCESS: fileId=%s, id=%v", record.FileID, result.InsertedID)
	}

	// Notification
	NotifyUpload(wallet, header.Filename, fileID)

	// Log Audit
	LogAudit(wallet, fileID, header.Filename, "FILE_UPLOADED", txHash, 0, "Initial registration and encryption on blockchain")

	//  FINAL RESPONSE
	c.JSON(http.StatusCreated, gin.H{
		"success":      true,
		"fileId":       fileID,
		"publicId":     publicID,
		"filename":     header.Filename,
		"fileHash":     fileHash,
		"ipfsCID":      ipfsCID,
		"ipfsURL":      ipfsURL,
		"encryptedUrl": ipfsURL, // alias for frontend compatibility
		"fileSize":     header.Size,
		"txHash":       txHash,
		"message":      "File uploaded! Seal on blockchain.",
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
