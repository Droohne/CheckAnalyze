package main

import (
	"CheckAnalyze/config"
	"CheckAnalyze/database"
	"CheckAnalyze/database/seed"
	"CheckAnalyze/handlers"
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var logger *slog.Logger

func initLogger() *slog.Logger {
	level := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = slog.LevelDebug
	}

	var handler slog.Handler
	if os.Getenv("LOG_FORMAT") == "text" {
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	} else {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	}

	l := slog.New(handler)
	slog.SetDefault(l)
	return l
}

// responseWriter wraps http.ResponseWriter to capture the status code for logging.
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := newResponseWriter(w)

		next.ServeHTTP(rw, r)

		logger.Info("request handled",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rw.statusCode,
			"duration_ms", time.Since(start).Milliseconds(),
			"remote_addr", r.RemoteAddr,
		)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("CORS_ORIGIN")
		if origin == "" {
			origin = "http://localhost:5173"
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if tokenString == "" {
			logger.Warn("auth failed: missing token", "path", r.URL.Path, "remote_addr", r.RemoteAddr)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return config.JWTSecret, nil
		})
		if err != nil || !token.Valid {
			logger.Warn("auth failed: invalid token", "path", r.URL.Path, "remote_addr", r.RemoteAddr, "error", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			logger.Warn("auth failed: invalid claims", "path", r.URL.Path)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			logger.Warn("auth failed: missing user_id claim", "path", r.URL.Path)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "user_id", int32(userIDFloat))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func main() {
	logger = initLogger()

	db := database.New()
	if err := db.Connect(); err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	logger.Info("database connected")

	ctx := context.Background()
	if err := seed.SeedUsers(ctx, db); err != nil {
		logger.Error("failed to seed users", "error", err)
	} else {
		logger.Info("users seeded")
	}

	h := handlers.New(db)

	mux := http.NewServeMux()

	// Routes
	mux.HandleFunc("GET /api/stats", h.GetStats)
	mux.HandleFunc("GET /api/shops", h.GetListShops)
	mux.HandleFunc("GET /api/shops/nearby", h.GetNearbyShopsByAddress)
	mux.HandleFunc("GET /api/shops/search", h.GetNearbyShopsByAddress)
	mux.HandleFunc("POST /api/shops/compare", h.PostCompareShopsOnTemplate)
	mux.HandleFunc("GET /api/products", h.GetListProducts)
	mux.HandleFunc("GET /api/products/{id}", h.GetProductById)
	mux.HandleFunc("GET /api/products/{id}/identical", h.GetIdenticalProductsByProductId)
	mux.HandleFunc("POST /api/products/{id}/identical", h.PostAddIdenticalProduct)
	mux.HandleFunc("GET /api/categories", h.GetListCategories)
	mux.HandleFunc("GET /api/templates", h.GetListTemplates)
	mux.HandleFunc("GET /api/templates/default", h.GetListDefaultTemplates)
	mux.HandleFunc("GET /api/templates/user", h.GetListUserTemplates)
	mux.HandleFunc("POST /api/templates", h.PostCreateTemplate)
	mux.HandleFunc("PUT /api/templates/{id}", h.PutUpdateTemplate)
	mux.HandleFunc("DELETE /api/templates/{id}", h.DeleteTemplateById)
	mux.HandleFunc("POST /api/templates/{id}/copy", h.PostCopyTemplateById)
	mux.HandleFunc("GET /api/user/profile", h.GetProfile)
	mux.HandleFunc("PUT /api/user/profile", h.PutUpdateProfile)
	mux.HandleFunc("PUT /api/user/password", h.PutChangePassword)
	mux.HandleFunc("DELETE /api/user", h.DeleteAccount)
	mux.HandleFunc("GET /api/user/stats", h.GetUserStats)
	mux.Handle("POST /api/upload", corsMiddleware(authMiddleware(http.HandlerFunc(h.PostUploadCheck))))
	mux.HandleFunc("GET /api/categories/by-name", h.GetCategoryByName)
	mux.HandleFunc("POST /api/categories", h.PostCreateCategory)
	mux.HandleFunc("DELETE /api/categories/{id}", h.DeleteCategoryById)
	mux.HandleFunc("GET /api/categories/by-product", h.GetCategoryByProductNameOrCreateUndefined)
	mux.HandleFunc("POST /api/auth/login", h.PostLogin)
	mux.HandleFunc("POST /api/auth/register", h.PostRegister)
	mux.HandleFunc("GET /api/feed", h.GetLiveFeed)
	mux.HandleFunc("GET /api/products/{id}/history", h.GetProductPriceHistory)
	mux.HandleFunc("GET /api/templates/{id}/products", h.GetTemplateWithProducts)

	// Wrap entire mux with logging + CORS
	handler := loggingMiddleware(corsMiddleware(mux))

	addr := ":8080"
	logger.Info("starting server", "addr", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
