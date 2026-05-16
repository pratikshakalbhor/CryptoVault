package handlers

import (
	"bytes"
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

	"code.sajari.com/docconv"
	"github.com/gin-gonic/gin"
	"github.com/ledongthuc/pdf"
	"go.mongodb.org/mongo-driver/bson"

	"cryptovault/database"
	"cryptovault/models"
	"cryptovault/utils"
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
// missing. It returns the first path that exists on disk, or "" if none do.
func findFile(storedPath, fileId, filename, subdir string) string {
	// Resolve the current working directory once for building relative paths.
	cwd, _ := filepath.Abs(".")

	candidates := []string{}

	// 1. Exact stored absolute path (most reliable for new uploads)
	if storedPath != "" {
		candidates = append(candidates, storedPath)
		// Also try it relative to cwd in case it was stored as relative
		if !filepath.IsAbs(storedPath) {
			candidates = append(candidates, filepath.Join(cwd, storedPath))
		}
	}

	// 2. Standard pattern: <subdir>/<fileId>_<cleanedFilename> relative to cwd
	if filename != "" {
		cleanName := strings.ReplaceAll(filename, " ", "_")
		safeFile := fileId + "_" + cleanName
		candidates = append(candidates,
			filepath.Join(cwd, subdir, safeFile),
			filepath.Join(cwd, "vault", safeFile),
			filepath.Join(cwd, "backup", safeFile),
		)
	}

	// 3. Legacy internal/storage pattern
	if filename != "" {
		ext := filepath.Ext(filename)
		candidates = append(candidates,
			filepath.Join(cwd, "internal", "storage", subdir, fileId+ext),
		)
	}

	fmt.Printf("[findFile] subdir=%s fileId=%s — checking %d candidates\n", subdir, fileId, len(candidates))
	for _, p := range candidates {
		if p == "" {
			continue
		}
		abs, err := filepath.Abs(p)
		if err != nil {
			continue
		}
		if _, statErr := os.Stat(abs); statErr == nil {
			fmt.Printf("[findFile] ✅ FOUND: %s\n", abs)
			return abs
		}
		fmt.Printf("[findFile] ❌ not found: %s\n", abs)
	}

	// 4. Last resort: scan the subdir for any file whose name starts with fileId
	scanDirs := []string{
		filepath.Join(cwd, subdir),
		filepath.Join(cwd, "backup"),
		filepath.Join(cwd, "vault"),
	}
	for _, dir := range scanDirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, e := range entries {
			if !e.IsDir() && strings.HasPrefix(e.Name(), fileId) {
				found := filepath.Join(dir, e.Name())
				fmt.Printf("[findFile] ✅ SCANNED FOUND: %s\n", found)
				return found
			}
		}
	}

	fmt.Printf("[findFile] ❌ No file found for fileId=%s subdir=%s\n", fileId, subdir)
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
			"success": false,
			"error":   "File record not found",
			"fileId":  fileId,
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
		fmt.Printf("[FORENSIC] ⚠️ Original local backup missing. Attempting IPFS recovery for CID: %s\n", record.IpfsCID)
		
		if record.IpfsCID != "" {
			// Try to recover from IPFS
			gateway := os.Getenv("PINATA_GATEWAY")
			if gateway == "" { gateway = "https://gateway.pinata.cloud" }
			url := fmt.Sprintf("%s/ipfs/%s", gateway, record.IpfsCID)
			
			resp, err := http.Get(url)
			if err == nil && resp.StatusCode == http.StatusOK {
				encryptedData, _ := io.ReadAll(resp.Body)
				resp.Body.Close()
				
				// Decrypt
				decryptedData, err := utils.DecryptAES(encryptedData)
				if err == nil {
					// Save to local backup for future use
					workDir, _ := filepath.Abs(".")
					cleanName := strings.ReplaceAll(record.Filename, " ", "_")
					newPath := filepath.Join(workDir, "backup", record.FileID+"_"+cleanName)
					os.MkdirAll(filepath.Dir(newPath), 0755)
					
					if err := os.WriteFile(newPath, decryptedData, 0644); err == nil {
						fmt.Printf("[FORENSIC] ✅ Recovered original from IPFS → %s\n", newPath)
						originalPath = newPath
						// Also update record in background so we don't have to fetch again
						go func() {
							col := database.GetCollection("files")
							ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
							defer cancel()
							_, _ = col.UpdateOne(ctx, bson.M{"fileId": fileId}, bson.M{"$set": bson.M{"backupPath": newPath}})
						}()
					}
				} else {
					fmt.Printf("[FORENSIC] ❌ IPFS Decryption failed: %v\n", err)
				}
			} else {
				if err != nil {
					fmt.Printf("[FORENSIC] ❌ IPFS Fetch failed: %v\n", err)
				} else {
					fmt.Printf("[FORENSIC] ❌ IPFS Fetch status: %d\n", resp.StatusCode)
				}
			}
		}
	}

	if originalPath == "" {
		fmt.Printf("[FORENSIC]\nBackup path: %s\nVault path: %s\nExists: false\nFileId: %s\n", record.BackupPath, record.VaultPath, fileId)
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Original backup file not found on disk",
			"fileId":  fileId,
			"hint":    "File may have been deleted or never saved locally. Try uploading a new version.",
		})
		return
	}
	fmt.Printf("[FORENSIC]\nBackup path: %s\nVault path: %s\nExists: true\nFileId: %s\n", originalPath, tamperedPath, fileId)

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

	// Step 4: Extension-based text diff support
	ext := strings.ToLower(filepath.Ext(record.Filename))
	textExts := map[string]bool{
		".txt": true, ".md": true, ".json": true, ".js": true,
		".ts": true, ".html": true, ".css": true, ".go": true,
		".java": true, ".py": true,
	}
	
	// A file is comparable if it's in the allowed list AND is valid text
	isText := textExts[ext] && isTextContent(originalData)
	isBinary := !isText


	// 7. Build content fields
	//    • For text files: return decoded UTF-8 strings (for diff viewer)
	//    • For binary files: return base64-encoded data-URL (for preview)
	//    • For docx: extract text and treat as text for diff viewer
	var originalContent, modifiedContent string

	if ext == ".docx" {
		resOrig, errOrig := docconv.Convert(bytes.NewReader(originalData), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", true)
		resTamp, errTamp := docconv.Convert(bytes.NewReader(tamperedData), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", true)
		if errOrig == nil && errTamp == nil {
			originalContent = resOrig.Body
			modifiedContent = resTamp.Body
			isText = true
			isBinary = false
		} else {
			// Fallback to binary preview if extraction fails
			isText = false
			isBinary = true
			b64Orig := base64.StdEncoding.EncodeToString(originalData)
			b64Tamp := base64.StdEncoding.EncodeToString(tamperedData)
			originalContent = "data:" + mimeType + ";base64," + b64Orig
			modifiedContent = "data:" + mimeType + ";base64," + b64Tamp
		}
	} else if ext == ".pdf" {
		pdfR1, err1 := pdf.NewReader(bytes.NewReader(originalData), int64(len(originalData)))
		pdfR2, err2 := pdf.NewReader(bytes.NewReader(tamperedData), int64(len(tamperedData)))
		if err1 == nil && err2 == nil {
			pt1, errPt1 := pdfR1.GetPlainText()
			pt2, errPt2 := pdfR2.GetPlainText()
			if errPt1 == nil && errPt2 == nil {
				b1, _ := io.ReadAll(pt1)
				b2, _ := io.ReadAll(pt2)
				originalContent = string(b1)
				modifiedContent = string(b2)
				isText = true
				isBinary = false
			} else {
				// Fallback to binary preview
				isText = false
				isBinary = true
				b64Orig := base64.StdEncoding.EncodeToString(originalData)
				b64Tamp := base64.StdEncoding.EncodeToString(tamperedData)
				originalContent = "data:" + mimeType + ";base64," + b64Orig
				modifiedContent = "data:" + mimeType + ";base64," + b64Tamp
			}
		} else {
			// Fallback to binary preview
			isText = false
			isBinary = true
			b64Orig := base64.StdEncoding.EncodeToString(originalData)
			b64Tamp := base64.StdEncoding.EncodeToString(tamperedData)
			originalContent = "data:" + mimeType + ";base64," + b64Orig
			modifiedContent = "data:" + mimeType + ";base64," + b64Tamp
		}
	} else if isText {
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

	var changes []map[string]interface{}

	if isText && !isIdentical {
		origLines := strings.Split(originalContent, "\n")
		tampLines := strings.Split(modifiedContent, "\n")
		
		maxLines := len(origLines)
		if len(tampLines) > maxLines { maxLines = len(tampLines) }
		
		for i := 0; i < maxLines && len(changes) < 50; i++ {
			orig := ""
			tamp := ""
			if i < len(origLines) { orig = origLines[i] }
			if i < len(tampLines) { tamp = tampLines[i] }
			
			if orig == tamp { continue }
			
			changeType := "modified"
			if orig == "" { changeType = "added" }
			if tamp == "" { changeType = "removed" }
			
			changes = append(changes, map[string]interface{}{
				"line":   i + 1,
				"type":   changeType,
				"before": orig,
				"after":  tamp,
			})
		}
	}

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
		// Changes
		"changes": changes,
		"changeSummary": map[string]interface{}{
			"totalChanges": len(changes),
			"hasChanges":   len(changes) > 0,
		},
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
		// Rebuild the standard vault path if it was empty in old records
		cleanName := strings.ReplaceAll(record.Filename, " ", "_")
		vaultPath = filepath.Join(".", "vault", fileId+"_"+cleanName)
	}
	absVault, _ := filepath.Abs(vaultPath)
	os.MkdirAll(filepath.Dir(absVault), 0755)

	// Perform copy (overwrite)
	source, err := os.Open(backupPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot open backup: " + err.Error()})
		return
	}
	defer source.Close()

	// Truncate and overwrite the vault file
	destination, err := os.OpenFile(absVault, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
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
			"status":     "VALID",
			"updatedAt":  now,
			"restoredAt": now,
			"tampered":   false,
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
