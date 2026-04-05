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
		log.Println("Warning: .env file nahi mila — environment variables vaprto")
		// Production madhe he normal aahe — crash nako
	}

	// Debug — env variables print kara
	log.Println("MONGODB_URI:", os.Getenv("MONGODB_URI"))
	log.Println("PORT:", os.Getenv("PORT"))

	// MongoDB connect karo
	database.ConnectDB()

	// Gin router
	r := gin.Default()
	r.SetTrustedProxies([]string{"127.0.0.1"}) // ← he add kara

	// CORS — Dynamic origin allow karo (Wildcard behavior)
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if origin == "" {
			c.Header("Access-Control-Allow-Origin", "*")
		} else {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

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
