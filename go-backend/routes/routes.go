package routes

import (
	"github.com/gin-gonic/gin"
	"cryptovault/handlers"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/upload",          handlers.UploadFile)
		api.POST("/verify",          handlers.VerifyFile)
		api.GET("/files",            handlers.GetAllFiles)
		api.GET("/files/:id",        handlers.GetFileByID)
		api.PUT("/files/:id/revoke", handlers.RevokeFile)
		api.GET("/stats",            handlers.GetStats)
	}
}