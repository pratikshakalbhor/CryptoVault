package database

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectDB() {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Fatal("MONGODB_URI nahi mila .env madhe!")
	}

	// MongoDB connect karo
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	clientOptions := options.Client().
		ApplyURI(mongoURI).
		SetConnectTimeout(30 * time.Second).
		SetServerSelectionTimeout(30 * time.Second)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("MongoDB connect error:", err)
	}

	// Connection test karo
	pingCtx, pingCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer pingCancel()
	
	err = client.Ping(pingCtx, nil)
	if err != nil {
		log.Fatal("MongoDB ping error:", err)
	}

	DB = client.Database("cryptovault")
	log.Println(" MongoDB Connected!")
}

func GetCollection(name string) *mongo.Collection {
	return DB.Collection(name)
}