package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectDB() (*mongo.Client, error) {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = os.Getenv("MONGODB_URI") // Fallback
	}

	if mongoURI == "" {
		return nil, fmt.Errorf("❌ MONGO_URI environment variable is not set. Please set it in Render dashboard > Environment")
	}
	log.Printf("🔗 Connecting to MongoDB...")

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	clientOptions := options.Client().
		ApplyURI(mongoURI).
		SetConnectTimeout(60 * time.Second).
		SetSocketTimeout(60 * time.Second).
		SetServerSelectionTimeout(60 * time.Second)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// Connection test karo
	pingCtx, pingCancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer pingCancel()
	
	err = client.Ping(pingCtx, nil)
	if err != nil {
		return nil, err
	}

	DB = client.Database("cryptovault")

	// ── Create Indexes ──
	col := DB.Collection("files")
	col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "fileId", Value: 1}},
		Options: options.Index().SetUnique(true).SetSparse(true),
	})
	col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "walletAddress", Value: 1}},
	})

	log.Println("✅ MongoDB Connected & Indexes verified!")
	return client, nil
}

func GetCollection(name string) *mongo.Collection {
	return DB.Collection(name)
}