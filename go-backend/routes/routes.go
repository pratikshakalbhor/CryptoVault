package routes

import (
	"cryptovault/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// ── Core ──
		api.POST("/upload", handlers.UploadFile)
		api.POST("/verify", handlers.VerifyFile)

		// ── Files ──
		api.GET("/files", handlers.GetAllFiles)
		api.GET("/files/trash/all", handlers.GetTrashFiles)
		api.GET("/files/:id", handlers.GetFileByID)
		api.PUT("/files/:id/revoke", handlers.RevokeFile)
		api.PUT("/files/:id/visibility", handlers.UpdateVisibility)
		api.PATCH("/files/:id/tx", handlers.UpdateTxHash)
		api.GET("/files/:id/versions", handlers.GetFileVersions)
		api.GET("/files/:id/certificate", handlers.DownloadCertificate)
		api.POST("/restore/:id", handlers.RestoreFile)
		api.GET("/files/:id/download", handlers.DownloadOriginal)
		api.DELETE("/files/:id", handlers.TrashFile)
		api.POST("/files/:id/untrash", handlers.RestoreFromTrash)
		api.DELETE("/files/:id/permanent", handlers.PermanentDeleteFile)

		// ── Stats ──
		api.GET("/stats", handlers.GetStats)
		api.GET("/dashboard", handlers.GetStats)

		// ── Notifications ──
		api.GET("/notifications", handlers.GetNotifications)
		api.PUT("/notifications/read", handlers.MarkNotificationsRead)
		api.POST("/notifications", handlers.CreateNotificationAPI)

		// ── Tamper Logs ──
		api.GET("/tamper-logs", handlers.GetTamperLogs)

		// ── Public ──
		api.GET("/public/verify/:id", handlers.PublicVerify)
	}
}
