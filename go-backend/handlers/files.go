package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"cryptovault/database"
	"cryptovault/models"
)

func GetAllFiles(c *gin.Context) {
	wallet := strings.ToLower(c.Query("wallet"))
	isBlockchain := c.Query("blockchain") == "true"

	if wallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "wallet required"})
		return
	}

	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 🔍 DEBUG LOGS
	log.Printf("Query wallet: %s", wallet)
	countAll, _ := col.CountDocuments(ctx, bson.M{})
	log.Printf("Total docs in DB: %d", countAll)
	
	cursorAll, _ := col.Find(ctx, bson.M{})
	log.Println("--- DEBUG: ALL DB DOCUMENTS ---")
	for cursorAll.Next(ctx) {
		var doc bson.M
		cursorAll.Decode(&doc)
		log.Println("DB DOC:", doc)
	}
	log.Println("-------------------------------")

	// ✅ Case-insensitive wallet search
	filter := bson.M{
		"walletAddress": bson.M{
			"$regex":   "^" + wallet + "$",
			"$options": "i",
		},
		"$or": []bson.M{
			{"isTrashed": bson.M{"$exists": false}},
			{"isTrashed": false},
		},
	}

	if isBlockchain {
		filter["txHash"] = bson.M{"$ne": ""}
	}

	opts := options.Find().SetSort(bson.M{"uploadedAt": -1})
	cursor, err := col.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "files": []models.FileRecord{}, "count": 0})
		return
	}
	defer cursor.Close(ctx)

	var files []models.FileRecord
	cursor.All(ctx, &files)
	if files == nil {
		files = []models.FileRecord{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(files),
		"data":    files,
	})
}

func GetFileByID(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err := collection.FindOne(ctx, bson.M{"fileId": fileID}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File nahi mila"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "file": record})
}

func RevokeFile(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err := collection.FindOne(ctx, bson.M{"fileId": fileID}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File nahi mila"})
		return
	}

	if record.IsRevoked {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already revoked aahe"})
		return
	}

	collection.UpdateOne(ctx,
		bson.M{"fileId": fileID},
		bson.M{"$set": bson.M{"isRevoked": true, "status": "revoked"}},
	)

	// Notification
	go CreateNotification(strings.ToLower(record.WalletAddress), "File revoked: "+record.Filename, "warning", fileID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fileID + " revoked successfully",
	})
}

func GetFileVersions(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err := collection.FindOne(ctx, bson.M{"fileId": fileID}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File nahi mila"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"fileId":   fileID,
		"versions": record.Versions,
		"total":    len(record.Versions),
	})
}

func GetStats(c *gin.Context) {
	wallet := strings.ToLower(c.Query("wallet"))
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"isDeleted": bson.M{"$ne": true}}
	if wallet != "" {
		filter["walletAddress"] = bson.M{
			"$regex":   "^" + wallet + "$",
			"$options": "i",
		}
	}

	total, _    := collection.CountDocuments(ctx, filter)
	
	validFilter := bson.M{"status": "valid", "isDeleted": bson.M{"$ne": true}}
	if wallet != "" {
		validFilter["walletAddress"] = bson.M{
			"$regex":   "^" + wallet + "$",
			"$options": "i",
		}
	}
	valid, _    := collection.CountDocuments(ctx, validFilter)
	
	tamperedFilter := bson.M{"status": "tampered", "isDeleted": bson.M{"$ne": true}}
	if wallet != "" {
		tamperedFilter["walletAddress"] = bson.M{
			"$regex":   "^" + wallet + "$",
			"$options": "i",
		}
	}
	tampered, _ := collection.CountDocuments(ctx, tamperedFilter)
	
	revokedFilter := bson.M{"status": "revoked", "isDeleted": bson.M{"$ne": true}}
	if wallet != "" {
		revokedFilter["walletAddress"] = bson.M{
			"$regex":   "^" + wallet + "$",
			"$options": "i",
		}
	}
	revoked, _  := collection.CountDocuments(ctx, revokedFilter)
	
	trashedFilter := bson.M{"isDeleted": true}
	if wallet != "" {
		trashedFilter["walletAddress"] = bson.M{
			"$regex":   "^" + wallet + "$",
			"$options": "i",
		}
	}
	trashed, _  := collection.CountDocuments(ctx, trashedFilter)

	// Fetch latest 5 verification logs for this wallet
	var recentLogs []models.FileRecord
	logsFilter := bson.M{"verifiedAt": bson.M{"$exists": true}, "isDeleted": bson.M{"$ne": true}}
	if wallet != "" {
		logsFilter["walletAddress"] = bson.M{
			"$regex":   "^" + wallet + "$",
			"$options": "i",
		}
	}
	
	opts := options.Find().SetSort(bson.M{"verifiedAt": -1}).SetLimit(5)
	cursor, err := collection.Find(ctx, logsFilter, opts)
	if err == nil {
		cursor.All(ctx, &recentLogs)
		cursor.Close(ctx)
	}
	if recentLogs == nil {
		recentLogs = []models.FileRecord{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats": models.Stats{
			Total:    total,
			Valid:    valid,
			Tampered: tampered,
			Revoked:  revoked,
			Trashed:  trashed,
		},
		"recentLogs": recentLogs,
	})
}

// UpdateVisibility — file visibility change karo
func UpdateVisibility(c *gin.Context) {
	fileID := c.Param("id")

	var body struct {
		Visibility string   `json:"visibility"`
		SharedWith []string `json:"sharedWith"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if body.Visibility != "private" && body.Visibility != "public" && body.Visibility != "shared" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid visibility — use private/public/shared"})
		return
	}

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"visibility": body.Visibility,
			"sharedWith": body.SharedWith,
		},
	}

	_, err := collection.UpdateOne(ctx, bson.M{"fileId": fileID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"fileId":     fileID,
		"visibility": body.Visibility,
		"sharedWith": body.SharedWith,
	})
}

// UpdateTxHash — Blockchain confirmation nantar txHash update kara
func UpdateTxHash(c *gin.Context) {
	fileID := c.Param("id")
	var body struct {
		TxHash      string `json:"txHash"`
		BlockNumber uint64 `json:"blockNumber"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// 🛡️ TX HASH VALIDATION
	if !strings.HasPrefix(body.TxHash, "0x") || len(body.TxHash) != 66 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction hash format"})
		return
	}

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Fetch record to get wallet for notification
	var record models.FileRecord
	collection.FindOne(ctx, bson.M{"fileId": fileID}).Decode(&record)

	update := bson.M{
		"$set": bson.M{
			"txHash": body.TxHash,
			"status": "valid",
		},
	}

	res, err := collection.UpdateOne(ctx, bson.M{"fileId": fileID}, update)
	if err != nil || res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Notification — upload success
	go CreateNotification(
		strings.ToLower(record.WalletAddress),
		"File uploaded & sealed on blockchain ✅: "+record.Filename,
		"success",
		fileID,
	)

	log.Printf("✅ Updated txHash for file %s: %s", fileID, body.TxHash)
	c.JSON(http.StatusOK, gin.H{"success": true, "txHash": body.TxHash})
}

// ─────────────────────────────────────────
// Trash & Restore Features
// ─────────────────────────────────────────

// ── RESTORE FILE ───────────────────────────────
// Frontend Restore button → he call hoto
func RestoreFile(c *gin.Context) {
	fileId := c.Param("id")

	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	if err := col.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// ── Restore = status back to valid ──
	now := time.Now()
	col.UpdateOne(ctx,
		bson.M{"fileId": fileId},
		bson.M{"$set": bson.M{
			"status":    "valid",
			"updatedAt": now,
		}},
	)

	// ── Notification create karo ──
	CreateNotification(
		record.WalletAddress,
		"🔄 File '"+record.Filename+"' restored successfully",
		"success",
		fileId,
	)

	// ── Response with download URL ──
	restoreUrl := record.EncryptedURL
	if restoreUrl == "" {
		restoreUrl = record.IpfsCID
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "File restored successfully",
		"fileId":     fileId,
		"restoreUrl": restoreUrl,
		"filename":   record.Filename,
		"status":     "valid",
	})
}

// ── TRASH FILE ─────────────────────────────────
func TrashFile(c *gin.Context) {
	fileId := c.Param("id")

	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	now := time.Now()
	col.UpdateOne(ctx,
		bson.M{"fileId": fileId},
		bson.M{"$set": bson.M{
			"isTrashed": true,
			"trashedAt": now,
			"updatedAt": now,
		}},
	)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "File moved to trash"})
}

// ── GET TRASH FILES ────────────────────────────
func GetTrashFiles(c *gin.Context) {
	wallet := c.Query("wallet")

	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"isTrashed": true}
	if wallet != "" {
		filter["walletAddress"] = wallet
	}

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "files": []interface{}{}})
		return
	}
	defer cursor.Close(ctx)

	var files []models.FileRecord
	cursor.All(ctx, &files)
	if files == nil {
		files = []models.FileRecord{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "files": files})
}

// ── RESTORE FROM TRASH ─────────────────────────
func RestoreFromTrash(c *gin.Context) {
	fileId := c.Param("id")

	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	now := time.Now()
	col.UpdateOne(ctx,
		bson.M{"fileId": fileId},
		bson.M{"$set": bson.M{
			"isTrashed": false,
			"trashedAt": nil,
			"updatedAt": now,
		}},
	)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "File restored from trash"})
}

// ── PERMANENT DELETE ───────────────────────────
func PermanentDeleteFile(c *gin.Context) {
	fileId := c.Param("id")

	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col.DeleteOne(ctx, bson.M{"fileId": fileId})

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "File permanently deleted"})
}

// ── PUBLIC VERIFY ──────────────────────────────
func PublicVerify(c *gin.Context) {
	fileId := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var record models.FileRecord
	err := collection.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Verify link invalid or expired"})
		return
	}

	wallet := record.WalletAddress
	if len(wallet) > 12 {
		wallet = wallet[:8] + "..." + wallet[len(wallet)-4:]
	}

	c.JSON(http.StatusOK, gin.H{
		"fileId":     record.FileID,
		"filename":   record.Filename,
		"status":     record.Status,
		"hash":       record.OriginalHash,
		"txHash":     record.TxHash,
		"uploadedAt": record.UploadedAt,
		"wallet":     wallet,
		"network":    "Ethereum Sepolia Testnet",
	})
}

// ── DOWNLOAD ORIGINAL FILE ──────────────────────
func DownloadOriginal(c *gin.Context) {
	fileId := c.Param("id")

	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.FileRecord
	if err := col.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	downloadUrl := record.EncryptedURL
	if downloadUrl == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Original file URL not available"})
		return
	}

	// Cloudinary se file fetch karo
	resp, err := http.Get(downloadUrl)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch original file"})
		return
	}
	defer resp.Body.Close()

	// Force download headers
	c.Header("Content-Disposition",
		fmt.Sprintf(`attachment; filename="%s"`, record.Filename))
	c.Header("Content-Type", record.MimeType)
	c.Header("Access-Control-Expose-Headers", "Content-Disposition")

	// Stream file to client
	io.Copy(c.Writer, resp.Body)

	// Status update
	col.UpdateOne(ctx,
		bson.M{"fileId": fileId},
		bson.M{"$set": bson.M{"status": "valid"}},
	)
}