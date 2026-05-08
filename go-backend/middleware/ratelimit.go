package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type client struct {
	count int
	last  time.Time
}

var (
	clients = make(map[string]*client)
	mu      sync.Mutex
)

// RateLimit creates a rate limiting middleware
func RateLimit(maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		mu.Lock()

		v, exists := clients[ip]
		if !exists || time.Since(v.last) > window {
			clients[ip] = &client{count: 1, last: time.Now()}
		} else {
			v.count++
			if v.count > maxRequests {
				mu.Unlock()
				c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded. Try again later."})
				c.Abort()
				return
			}
			// Update last time only if not exceeding? Wait, standard window logic: 
			// if within window, we just increment. The window doesn't slide with every request if we want a fixed window.
			// Let's reset the time if the window passed (handled above), otherwise keep the window start time as `last`.
			// So no need to update `last` on every request.
		}
		mu.Unlock()
		c.Next()
	}
}
