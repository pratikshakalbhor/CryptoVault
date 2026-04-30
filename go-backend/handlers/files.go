package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"cryptovault/database"
	"cryptovault/models"
)

func GetAllFiles(c *gin.Context) {
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Get Wallet from Query
	wallet := c.Query("wallet")
	if wallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "wallet address is required (e.g. /api/files?wallet=0x...)"})
		return
	}

	// 2. Build Filter
	filter := bson.M{
		"isDeleted":     bson.M{"$ne": true},
		"walletAddress": wallet, // Correct field name from models/file.go
	}

	fmt.Printf("[DEBUG] Fetching files for wallet: %s\n", wallet)

	// 3. Query Database
	opts := options.Find().SetSort(bson.M{"uploadedAt": -1})
	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		fmt.Println("ERROR: MongoDB Find failed:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database fetch failed", "details": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	// 4. Decode Results
	var files []models.FileRecord
	if err := cursor.All(ctx, &files); err != nil {
		fmt.Println("ERROR: Cursor All decoding failed:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Data decoding failed", "details": err.Error()})
		return
	}

	// Avoid null response
	if files == nil {
		files = []models.FileRecord{}
	}

	fmt.Printf("[DEBUG] Found %d files for wallet %s\n", len(files), wallet)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(files),
		"files":   files,
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
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	total, _    := collection.CountDocuments(ctx, bson.M{"isDeleted": bson.M{"$ne": true}})
	valid, _    := collection.CountDocuments(ctx, bson.M{"status": "valid", "isDeleted": bson.M{"$ne": true}})
	tampered, _ := collection.CountDocuments(ctx, bson.M{"status": "tampered", "isDeleted": bson.M{"$ne": true}})
	revoked, _  := collection.CountDocuments(ctx, bson.M{"status": "revoked", "isDeleted": bson.M{"$ne": true}})
	trashed, _  := collection.CountDocuments(ctx, bson.M{"isDeleted": true})

	// Fetch latest 5 verification logs
	var recentLogs []models.FileRecord
	opts := options.Find().SetSort(bson.M{"verifiedAt": -1}).SetLimit(5)
	cursor, err := collection.Find(ctx, bson.M{"verifiedAt": bson.M{"$exists": true}, "isDeleted": bson.M{"$ne": true}}, opts)
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

// ─────────────────────────────────────────
// Trash & Restore Features
// ─────────────────────────────────────────

func TrashFile(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"isDeleted": true,
			"deletedAt": time.Now(),
		},
	}

	res, err := collection.UpdateOne(ctx, bson.M{"fileId": fileID}, update)
	if err != nil || res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "File moved to trash"})
}

func RestoreFile(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"isDeleted": false,
			"deletedAt": nil,
		},
	}

	res, err := collection.UpdateOne(ctx, bson.M{"fileId": fileID}, update)
	if err != nil || res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "File restored"})
}

func PermanentDeleteFile(c *gin.Context) {
	fileID := c.Param("id")

	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := collection.DeleteOne(ctx, bson.M{"fileId": fileID})
	if err != nil || res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "File deleted permanently"})
}

func GetTrashFiles(c *gin.Context) {
	collection := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"isDeleted": true}
	wallet := c.Query("wallet")
	if wallet != "" {
		filter["walletAddress"] = wallet
	}

	opts := options.Find().SetSort(bson.M{"deletedAt": -1})
	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Trash fetch error"})
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
		"files":   files,
	})
}