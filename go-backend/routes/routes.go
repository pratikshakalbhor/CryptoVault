package routes

import (
	"cryptovault/handlers"
	"cryptovault/middleware"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// ── Core ──
		api.POST("/upload",  handlers.UploadFile)
		api.POST("/verify",  handlers.VerifyFile)

		// ── Files ──
		api.GET("/files",                 handlers.GetAllFiles)
		api.GET("/files/:id",             handlers.GetFileByID)
		api.PUT("/files/:id/revoke",      handlers.RevokeFile)
		api.PUT("/files/:id/visibility",  handlers.UpdateVisibility)
		api.PATCH("/files/:id/tx",        handlers.UpdateTxHash)
		api.GET("/files/:id/versions",    handlers.GetFileVersions)
		api.GET("/files/:id/certificate", handlers.DownloadCertificate)
		api.POST("/files/:id/restore",    handlers.RestoreFile)
		api.GET("/files/:id/download",    handlers.DownloadOriginal)

		// ── Trash ──
		api.DELETE("/files/:id",          handlers.TrashFile)
		api.GET("/files/trash/all",       handlers.GetTrashFiles)
		api.POST("/files/:id/untrash",    handlers.RestoreFromTrash)
		api.DELETE("/files/:id/permanent",handlers.PermanentDeleteFile)

		// ── Stats ──
		api.GET("/stats",     handlers.GetStats)
		api.GET("/dashboard", handlers.GetStats)

		// ── Notifications ── (NEW!)
		api.GET("/notifications",         handlers.GetNotifications)
		api.PUT("/notifications/read",    handlers.MarkNotificationsRead)
		api.POST("/notifications",        handlers.CreateNotificationAPI)

		// ── Public ──
		api.GET("/public/verify/:id", middleware.RateLimit(10, time.Minute), handlers.PublicVerify)
	}
}