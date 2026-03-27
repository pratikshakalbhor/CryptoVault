package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"cryptovault/database"
	"cryptovault/routes"
)

func main() {
	// .env load karo
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file nahi mila")
	}

	// MongoDB connect karo
	database.ConnectDB()

	// Gin router
	r := gin.Default()
	r.SetTrustedProxies([]string{"127.0.0.1"}) // ← he add kara

	// CORS — React la allow karo
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Home route
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "CryptoVault Go Backend Running! 🚀",
			"version": "1.0.0",
		})
	})

	// API routes register karo
	routes.RegisterRoutes(r)

	// Server start karo
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("Server running on http://localhost:%s", port)
	r.Run(":" + port)
}