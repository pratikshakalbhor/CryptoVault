package handlers

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
)

// ForensicCompare — GET /api/file/forensic-compare/:fileId
func ForensicCompare(c *gin.Context) {
	fileId := c.Param("fileId")
	fmt.Printf("\n[FORENSIC] --- Comparison Request: %s ---\n", fileId)

	// 1. Fetch record from MongoDB to determine the correct extension
	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.FileRecord
	err := col.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record)
	
	ext := ".docx" // Default fallback
	if err == nil && record.Filename != "" {
		ext = filepath.Ext(record.Filename)
	}

	// 2. Define exact paths
	// Note: Using the specific internal/storage/... structure requested
	relBackup := filepath.Join("internal", "storage", "backup", fileId+ext)
	relVault  := filepath.Join("internal", "storage", "vault",  fileId+ext)

	originalPath, _ := filepath.Abs(relBackup)
	tamperedPath, _ := filepath.Abs(relVault)

	fmt.Printf("[FORENSIC] Searching Original at: %s\n", originalPath)
	fmt.Printf("[FORENSIC] Searching Tampered at: %s\n", tamperedPath)

	// 3. Validation
	if _, err := os.Stat(originalPath); os.IsNotExist(err) {
		fmt.Printf("[FORENSIC] ERROR: Backup file NOT FOUND at %s\n", originalPath)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Forensic backup missing",
			"path":  originalPath,
		})
		return
	}

	if _, err := os.Stat(tamperedPath); os.IsNotExist(err) {
		fmt.Printf("[FORENSIC] ERROR: Vault file NOT FOUND at %s\n", tamperedPath)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Forensic vault file missing",
			"path":  tamperedPath,
		})
		return
	}

	// 4. Read files (Base64 for binary support)
	originalData, _ := os.ReadFile(originalPath)
	tamperedData, _ := os.ReadFile(tamperedPath)

	c.JSON(http.StatusOK, gin.H{
		"original": base64.StdEncoding.EncodeToString(originalData),
		"modified": base64.StdEncoding.EncodeToString(tamperedData),
		"fileId":   fileId,
		"fileName": record.Filename,
		"status":   "tampered",
		"riskScore": 85,
		"riskLevel": "HIGH",
		"isTextComparable": true,
	})
}

// ForensicRestore — POST /api/restore/:fileId
// Uses io.Copy to overwrite tampered file with backup
func ForensicRestore(c *gin.Context) {
	fileId := c.Param("fileId")
	fmt.Printf("\n[RESTORE] --- Forensic Recovery Initiated: %s ---\n", fileId)

	// 1. Get extension
	col := database.GetCollection("files")
	var record models.FileRecord
	col.FindOne(context.Background(), bson.M{"fileId": fileId}).Decode(&record)
	
	ext := ".docx"
	if record.Filename != "" {
		ext = filepath.Ext(record.Filename)
	}

	backupPath, _ := filepath.Abs(filepath.Join("internal", "storage", "backup", fileId+ext))
	vaultPath, _  := filepath.Abs(filepath.Join("internal", "storage", "vault",  fileId+ext))

	fmt.Printf("[RESTORE] Source (Backup): %s\n", backupPath)
	fmt.Printf("[RESTORE] Destination (Vault): %s\n", vaultPath)

	// 2. Perform Copy
	source, err := os.Open(backupPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Backup source not found"})
		return
	}
	defer source.Close()

	// Ensure vault directory exists
	os.MkdirAll(filepath.Dir(vaultPath), 0755)

	destination, err := os.Create(vaultPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open destination for writing"})
		return
	}
	defer destination.Close()

	n, err := io.Copy(destination, source)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File copy failed"})
		return
	}

	fmt.Printf("[RESTORE] Successfully restored %d bytes to %s\n", n, vaultPath)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "File integrity restored from backup",
		"fileId":  fileId,
	})
}

