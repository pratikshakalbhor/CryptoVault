package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
)

// ──────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────

// sha256Hex returns the lowercase hex-encoded SHA-256 of the given bytes.
func sha256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return fmt.Sprintf("%x", h)
}

// isTextContent returns true when data appears to be valid UTF-8 text.
func isTextContent(data []byte) bool {
	if len(data) == 0 {
		return true
	}
	// Limit sample to first 8 KB for performance
	sample := data
	if len(sample) > 8192 {
		sample = data[:8192]
	}
	return utf8.Valid(sample)
}

// riskScore computes 0-100 based on how different two byte slices are.
// 0 = identical, 100 = completely different.
func riskScore(a, b []byte) int {
	if len(a) == 0 && len(b) == 0 {
		return 0
	}
	if sha256Hex(a) == sha256Hex(b) {
		return 0
	}
	// Rough Levenshtein on lines would be expensive for large files.
	// Use a quick approximation: percentage of differing bytes in the
	// shorter slice + any length difference contribution.
	maxLen := len(a)
	if len(b) > maxLen {
		maxLen = len(b)
	}
	minLen := len(a)
	if len(b) < minLen {
		minLen = len(b)
	}

	diffBytes := 0
	for i := 0; i < minLen; i++ {
		if a[i] != b[i] {
			diffBytes++
		}
	}
	// Count the extra bytes in the longer file as fully different
	diffBytes += (maxLen - minLen)

	score := int(float64(diffBytes) / float64(maxLen) * 100)
	// Clamp
	if score < 5 && sha256Hex(a) != sha256Hex(b) {
		score = 5 // minimum non-zero for "tampered"
	}
	if score > 100 {
		score = 100
	}
	return score
}

// riskLevel maps a score 0-100 to a label.
func riskLevel(score int) string {
	switch {
	case score == 0:
		return "SECURE"
	case score <= 20:
		return "LOW"
	case score <= 50:
		return "MEDIUM"
	case score <= 80:
		return "HIGH"
	default:
		return "CRITICAL"
	}
}

// detectMime returns a best-effort MIME type from the file extension.
func detectMime(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		switch ext {
		case ".docx":
			mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		case ".xlsx":
			mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		case ".pptx":
			mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
		case ".md":
			mimeType = "text/markdown"
		default:
			mimeType = "application/octet-stream"
		}
	}
	return mimeType
}

// findFile searches several candidate paths when the stored path is stale or
// missing.  It returns the first path that exists, or "" if none do.
func findFile(storedPath, fileId, filename, subdir string) string {
	candidates := []string{}

	// 1. Exact stored path (most reliable when present)
	if storedPath != "" {
		candidates = append(candidates, storedPath)
	}

	// 2. Standard pattern: ./vault/<fileId>_<cleanedFilename>
	if filename != "" {
		cleanName := strings.ReplaceAll(filename, " ", "_")
		candidates = append(candidates,
			filepath.Join("vault", fileId+"_"+cleanName),
			filepath.Join("vault", fileId+"_"+cleanName),
		)
	}

	// 3. Legacy internal/storage pattern (old forensic_compare logic)
	if filename != "" {
		ext := filepath.Ext(filename)
		candidates = append(candidates,
			filepath.Join("internal", "storage", subdir, fileId+ext),
		)
	}

	for _, p := range candidates {
		abs, err := filepath.Abs(p)
		if err != nil {
			continue
		}
		if _, err := os.Stat(abs); err == nil {
			return abs
		}
	}
	return ""
}

// ──────────────────────────────────────────────────────────
// ForensicCompare — GET /api/file/forensic-compare/:fileId
// ──────────────────────────────────────────────────────────
func ForensicCompare(c *gin.Context) {
	fileId := c.Param("fileId")
	fmt.Printf("\n[FORENSIC] ────────────────────────────────────────\n")
	fmt.Printf("[FORENSIC] Comparison requested for fileId: %s\n", fileId)

	// 1. Fetch MongoDB record
	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var record models.FileRecord
	err := col.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record)
	if err != nil {
		fmt.Printf("[FORENSIC] ❌ File not found in MongoDB: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{
			"error":  "File record not found",
			"fileId": fileId,
		})
		return
	}
	fmt.Printf("[FORENSIC] ✅ MongoDB record found: %s | backupPath=%s | vaultPath=%s\n",
		record.Filename, record.BackupPath, record.VaultPath)

	// 2. Resolve actual file paths
	originalPath := findFile(record.BackupPath, fileId, record.Filename, "backup")
	tamperedPath := findFile(record.VaultPath, fileId, record.Filename, "vault")

	fmt.Printf("[FORENSIC] Original resolved path: %q\n", originalPath)
	fmt.Printf("[FORENSIC] Tampered resolved path: %q\n", tamperedPath)

	if originalPath == "" {
		fmt.Printf("[FORENSIC] ❌ No backup/original file found\n")
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Original backup file not found on disk",
			"fileId":  fileId,
			"hint":    "File may have been deleted or never saved locally",
		})
		return
	}

	// 3. Read original file (required)
	originalData, err := os.ReadFile(originalPath)
	if err != nil {
		fmt.Printf("[FORENSIC] ❌ Cannot read original: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot read original file: " + err.Error()})
		return
	}

	// 4. Read tampered/current file (optional — may not exist yet)
	var tamperedData []byte
	tamperedMissing := false
	if tamperedPath == "" {
		tamperedMissing = true
		tamperedData = originalData // treat as identical when only one copy exists
		fmt.Printf("[FORENSIC] ⚠️  Tampered/vault file not found — using original for comparison\n")
	} else {
		tamperedData, err = os.ReadFile(tamperedPath)
		if err != nil {
			tamperedMissing = true
			tamperedData = originalData
			fmt.Printf("[FORENSIC] ⚠️  Cannot read vault file: %v — using original\n", err)
		}
	}

	// 5. Forensic analysis
	origHash := sha256Hex(originalData)
	tampHash := sha256Hex(tamperedData)
	isIdentical := origHash == tampHash

	score := 0
	if !isIdentical {
		score = riskScore(originalData, tamperedData)
	}
	level := riskLevel(score)

	fileStatus := record.Status
	if fileStatus == "" {
		if isIdentical {
			fileStatus = "valid"
		} else {
			fileStatus = "tampered"
		}
	}

	// 6. Determine MIME / text vs binary
	mimeType := record.MimeType
	if mimeType == "" {
		mimeType = detectMime(record.Filename)
	}
	isText := isTextContent(originalData)
	isBinary := !isText

	// 7. Build content fields
	//    • For text files: return decoded UTF-8 strings (for diff viewer)
	//    • For binary files: return base64-encoded data-URL (for preview)
	var originalContent, modifiedContent string

	if isText {
		originalContent = string(originalData)
		modifiedContent = string(tamperedData)
	} else {
		// Binary: wrap as data-URL so the preview pane can render images/PDFs
		b64Orig := base64.StdEncoding.EncodeToString(originalData)
		b64Tamp := base64.StdEncoding.EncodeToString(tamperedData)
		originalContent = "data:" + mimeType + ";base64," + b64Orig
		modifiedContent = "data:" + mimeType + ";base64," + b64Tamp
	}

	// Also always provide raw base64 fields for download evidence
	b64Orig := base64.StdEncoding.EncodeToString(originalData)
	b64Tamp := base64.StdEncoding.EncodeToString(tamperedData)

	fmt.Printf("[FORENSIC] ✅ Analysis complete — identical=%v score=%d level=%s text=%v\n",
		isIdentical, score, level, isText)

	c.JSON(http.StatusOK, gin.H{
		// Content for diff/preview panels
		"original":         originalContent,
		"modified":         modifiedContent,
		// Raw base64 for "Download Evidence" button
		"originalBase64":   b64Orig,
		"modifiedBase64":   b64Tamp,
		// Hashes
		"originalHash":     origHash,
		"modifiedHash":     tampHash,
		// File metadata
		"fileId":           fileId,
		"fileName":         record.Filename,
		"mimeType":         mimeType,
		"fileSize":         record.FileSize,
		"walletAddress":    record.WalletAddress,
		"txHash":           record.TxHash,
		"uploadedAt":       record.UploadedAt,
		// Status
		"status":           fileStatus,
		"isIdentical":      isIdentical,
		"tamperedMissing":  tamperedMissing,
		// Forensic scores
		"riskScore":        score,
		"riskLevel":        level,
		// Diff capability flags
		"isTextComparable": isText,
		"isBinary":         isBinary,
	})
}

// ──────────────────────────────────────────────────────────
// ForensicRestore — POST /api/restore/:fileId
// ──────────────────────────────────────────────────────────
func ForensicRestore(c *gin.Context) {
	fileId := c.Param("fileId")
	fmt.Printf("\n[RESTORE] ────────────────────────────────────────\n")
	fmt.Printf("[RESTORE] Recovery initiated for fileId: %s\n", fileId)

	col := database.GetCollection("files")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var record models.FileRecord
	if err := col.FindOne(ctx, bson.M{"fileId": fileId}).Decode(&record); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File record not found"})
		return
	}

	backupPath := findFile(record.BackupPath, fileId, record.Filename, "backup")
	if backupPath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Backup source not found on disk"})
		return
	}

	// Determine destination (vault path)
	vaultPath := record.VaultPath
	if vaultPath == "" {
		vaultPath = backupPath // restore in-place
	}
	absVault, _ := filepath.Abs(vaultPath)
	os.MkdirAll(filepath.Dir(absVault), 0755)

	// Perform copy
	source, err := os.Open(backupPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot open backup: " + err.Error()})
		return
	}
	defer source.Close()

	destination, err := os.Create(absVault)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot write restored file: " + err.Error()})
		return
	}
	defer destination.Close()

	n, err := io.Copy(destination, source)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "File copy failed: " + err.Error()})
		return
	}

	// Update status in MongoDB
	now := time.Now()
	_, _ = col.UpdateOne(ctx, bson.M{"fileId": fileId}, bson.M{
		"$set": bson.M{
			"status":    "valid",
			"updatedAt": now,
		},
	})

	// Audit log
	LogAudit(record.WalletAddress, fileId, record.Filename, "FILE_RESTORED",
		record.TxHash, 0, fmt.Sprintf("Forensic restore: %d bytes written", n))

	fmt.Printf("[RESTORE] ✅ Restored %d bytes → %s\n", n, absVault)

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "File integrity restored from backup",
		"fileId":       fileId,
		"bytesWritten": n,
	})
}
