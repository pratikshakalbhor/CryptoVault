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
		api.GET("/files/:id/versions", handlers.GetFileVersions)
		api.GET("/files/:id/certificate", handlers.DownloadCertificate)
		api.PUT("/files/:id/revoke", handlers.RevokeFile)
		api.PUT("/files/:id/visibility", handlers.UpdateVisibility)
		api.DELETE("/files/:id",     handlers.TrashFile) // Soft Delete
		api.POST("/files/:id/restore", handlers.RestoreFile)
		api.DELETE("/files/:id/permanent", handlers.PermanentDeleteFile)
		api.GET("/files/trash/all",  handlers.GetTrashFiles)
		api.GET("/stats",            handlers.GetStats)
		api.GET("/public/verify/:id", handlers.PublicVerify)
	}
}