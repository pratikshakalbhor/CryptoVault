package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	uri := "mongodb+srv://kalbhorpratiksha333_db_user:76q1xs26EPW2InZt@cluster0.xjdrlzw.mongodb.net/?appName=Cluster0"
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	collection := client.Database("cryptovault").Collection("files")
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)

	count, _ := collection.CountDocuments(ctx, bson.M{})
	fmt.Printf("Total files in DB: %d\n", count)

	var result bson.M
	err = collection.FindOne(ctx, bson.M{"fileId": "FILE-17775233675"}).Decode(&result)
	if err == nil {
		fmt.Println("File ID found in DB:", result["fileId"])
		fmt.Println("File Status:", result["status"])
		fmt.Println("File Hash:", result["originalHash"])
	} else {
		fmt.Println("File ID NOT found in DB")
	}
}
