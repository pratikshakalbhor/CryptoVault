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
)

// ── GET NOTIFICATIONS ──────────────────────────
func GetNotifications(c *gin.Context) {
	wallet := c.Query("wallet")
	if wallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "wallet required"})
		return
	}

	col := database.GetCollection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts   := options.Find().
		SetSort(bson.M{"createdAt": -1}).
		SetLimit(50)

	cursor, err := col.Find(ctx, bson.M{"user": wallet}, opts)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true, "notifications": []interface{}{}, "unread": 0,
		})
		return
	}
	defer cursor.Close(ctx)

	var notifications []bson.M
	cursor.All(ctx, &notifications)
	if notifications == nil {
		notifications = []bson.M{}
	}

	unread, _ := col.CountDocuments(ctx, bson.M{
		"user": wallet,
		"read": false,
	})

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"notifications": notifications,
		"unread":        unread,
		"total":         len(notifications),
	})
}

// ── MARK ALL READ ──────────────────────────────
func MarkNotificationsRead(c *gin.Context) {
	wallet := c.Query("wallet")
	if wallet == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "wallet required"})
		return
	}

	col := database.GetCollection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, _ := col.UpdateMany(ctx,
		bson.M{"user": wallet, "read": false},
		bson.M{"$set": bson.M{"read": true}},
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"updated": result.ModifiedCount,
	})
}

// ── CREATE NOTIFICATION API ────────────────────
func CreateNotificationAPI(c *gin.Context) {
	var body struct {
		Wallet  string `json:"wallet"`
		Message string `json:"message"`
		Type    string `json:"type"`
		FileId  string `json:"fileId"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	CreateNotification(body.Wallet, body.Message, body.Type, body.FileId)
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ── INTERNAL HELPER ────────────────────────────
func CreateNotification(wallet, message, notifType, fileId string) {
	if wallet == "" || wallet == "unknown" {
		return
	}

	col := database.GetCollection("notifications")
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	col.InsertOne(ctx, bson.M{
		"user":      wallet,
		"message":   message,
		"type":      notifType,
		"fileId":    fileId,
		"read":      false,
		"createdAt": time.Now(),
	})
}

// ── SMART NOTIFICATION MESSAGES ───────────────
// Upload success
func NotifyUpload(wallet, filename, fileId string) {
	msg := fmt.Sprintf("📁 File '%s' uploaded & saved to blockchain registry", filename)
	CreateNotification(wallet, msg, "success", fileId)
}

// Blockchain TX confirmed
func NotifyBlockchainSealed(wallet, filename, txHash, fileId string) {
	short := txHash
	if len(txHash) > 16 {
		short = txHash[:10] + "..." + txHash[len(txHash)-6:]
	}
	msg := fmt.Sprintf("⛓️ '%s' sealed on Ethereum Sepolia! TX: %s", filename, short)
	CreateNotification(wallet, msg, "success", fileId)
}

// Verify valid
func NotifyVerifyValid(wallet, filename, fileId string) {
	msg := fmt.Sprintf("✅ File '%s' verified — integrity confirmed, no tampering detected", filename)
	CreateNotification(wallet, msg, "success", fileId)
}

// Tamper detected — RED ALERT!
func NotifyTamperDetected(wallet, filename, fileId string) {
	msg := fmt.Sprintf("🚨 SECURITY ALERT: '%s' has been TAMPERED! File hash mismatch detected. Restore immediately!", filename)
	CreateNotification(wallet, msg, "error", fileId)
}

// File expiry warning
func NotifyExpiryWarning(wallet, filename, fileId string, daysLeft int) {
	msg := fmt.Sprintf("⚠️ File '%s' expires in %d day(s). Renew or download before expiry!", filename, daysLeft)
	CreateNotification(wallet, msg, "warning", fileId)
}

// File restored
func NotifyRestored(wallet, filename, fileId string) {
	msg := fmt.Sprintf("🔄 File '%s' successfully restored to original version", filename)
	CreateNotification(wallet, msg, "success", fileId)
}

// File revoked
func NotifyRevoked(wallet, filename, fileId string) {
	msg := fmt.Sprintf("🔒 File '%s' has been revoked and is no longer accessible", filename)
	CreateNotification(wallet, msg, "warning", fileId)
}

// File shared
func NotifyShared(wallet, filename, fileId string) {
	msg := fmt.Sprintf("🔗 File '%s' verification link has been shared", filename)
	CreateNotification(wallet, msg, "info", fileId)
}
