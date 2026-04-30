package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
)

func VerifyFile(c *gin.Context) {
	// 1. Receive File & FileID
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File missing in request"})
		return
	}
	defer file.Close()

	fileId := c.PostForm("fileId")
	currentSize := header.Size

	// 2. Read file into bytes safely
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// Generate current hash using bytes
	currentHash := utils.GenerateSHA256FromBytes(fileBytes)
	currentHash = strings.ToLower(strings.TrimSpace(currentHash))

	// 3. Fetch from DB
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.FileRecord
	dbFound := true
	warning := ""
	
	// Lookup strategy: fileId if provided, otherwise fallback to filename
	var dbErr error
	if fileId != "" && fileId != "undefined" && fileId != "null" {
		dbErr = collection.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record)
	} else {
		warning = "Warning: No fileId provided. Falling back to filename search."
		dbErr = collection.FindOne(ctx, bson.M{"filename": header.Filename}).Decode(&record)
	}

	if dbErr != nil {
		dbFound = false
	}

	dbHash := ""
	storedSize := int64(0)
	if dbFound {
		dbHash = strings.ToLower(strings.TrimSpace(record.OriginalHash))
		fileId = record.FileID // Ensure we have the correct fileId for blockchain check
		storedSize = record.FileSize
	}

	// 4. Fetch from Blockchain
	chainHash := ""
	chainCID := ""
	if currentHash != "" {
		fmt.Printf("[DEBUG] Searching Blockchain for Hash: '%s'\n", currentHash)
		cHash, cCid, err := utils.FetchFileFromChain(currentHash)
		if err != nil {
			fmt.Printf("[DEBUG] Contract Call Failed: %v\n", err)
		}
		
		if cHash == "" {
			fmt.Println("[DEBUG] Blockchain returned EMPTY string for this ID")
		} else {
			fmt.Printf("[DEBUG] Found Hash on Blockchain: %s\n", cHash)
			chainHash = strings.ToLower(strings.TrimSpace(cHash))
			chainCID = strings.TrimSpace(cCid)
		}
	}

	// 5. Decision Logic
	var status string
	var message string
	var comparison gin.H

	fmt.Println("--- VERIFICATION DEBUG ---")
	fmt.Println("FileId:        ", fileId)
	fmt.Println("DB Hash:       ", dbHash)
	fmt.Println("Chain Hash:    ", chainHash)
	fmt.Println("Current Hash:  ", currentHash)
	fmt.Println("--------------------------")

	if !dbFound {
		status = "NOT_REGISTERED"
		message = "🚫 This file was not found in the system"
	} else if currentHash != dbHash {
		status = "TAMPERED"
		message = "⚠ This file has been modified"
		comparison = gin.H{
			"sizeMatch":        currentSize == storedSize,
			"originalFileSize": storedSize,
			"currentFileSize":  currentSize,
		}
	} else if chainHash == "" {
		status = "NOT_SYNCED"
		message = "⚠️ File record not yet found on the blockchain"
	} else if currentHash != chainHash {
		status = "DATABASE_COMPROMISED"
		message = "🚨 Database breach! File matches DB but not the Blockchain."
		comparison = gin.H{
			"sizeMatch":        currentSize == storedSize,
			"originalFileSize": storedSize,
			"currentFileSize":  currentSize,
		}
	} else {
		status = "VALID"
		message = "✔ This file is safe and unchanged"
	}

	// Update record in DB if found
	if dbFound && status != "NOT_REGISTERED" {
		collection.UpdateOne(ctx,
			bson.M{"fileId": record.FileID},
			bson.M{"$set": bson.M{
				"status":     strings.ToLower(status),
				"verifiedAt": time.Now(),
			}},
		)
	}

	// 6. Response
	resp := gin.H{
		"status":         status,
		"currentHash":    currentHash,
		"originalHash":   dbHash,
		"isMatch":        currentHash == dbHash,
		"dbVerified":     dbFound && currentHash == dbHash,
		"blockchainHash": chainHash,
		"blockchainCID":  chainCID,
		"message":        message,
		"fileId":         fileId,
		"filename":       record.Filename,
		"ipfsCID":        record.IpfsCID,
		"ipfsURL":        record.EncryptedURL,
		"txHash":         record.TxHash,
	}

	if warning != "" {
		resp["warning"] = warning
	}

	if comparison != nil {
		resp["comparison"] = comparison
	}

	if chainHash == "" && status != "NOT_REGISTERED" {
		resp["debug"] = fmt.Sprintf("Contract %s returned empty for ID '%s'", os.Getenv("CONTRACT_ADDRESS"), fileId)
	}

	c.JSON(http.StatusOK, resp)
}