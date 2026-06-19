package main

import (
	"net/http"

	"CheckAnalyze/database"
	"CheckAnalyze/handlers"
)

func main() {
	db := database.New()
	if err := db.Connect(); err != nil {
		panic(err)
	}
	defer db.Close()

	h := handlers.New(db)

	// Routes
	http.HandleFunc("GET /api/stats", h.GetStats)
	http.HandleFunc("GET /api/Shops", h.GetListShops)
	http.HandleFunc("GET /api/Shops/nearby", h.GetNearbyShopsByAddress)
	http.HandleFunc("GET /api/Shops/search", h.GetNearbyShopsByAddress)
	http.HandleFunc("POST /api/Shops/compare", h.PostCompareShopsOnTemplate)
	http.HandleFunc("GET /api/products", h.GetListProducts)
	http.HandleFunc("GET /api/products/{id}", h.GetProductById)
	http.HandleFunc("GET /api/products/{id}/identical", h.GetIdenticalProductsByProductId)
	http.HandleFunc("POST /api/products/{id}/identical", h.GetIdenticalProductsByProductId)
	http.HandleFunc("GET /api/categories", h.GetListCategories)
	http.HandleFunc("GET /api/templates", h.GetListTemplates)
	http.HandleFunc("GET /api/templates/default", h.GetListDefaultTemplates)
	http.HandleFunc("GET /api/templates/user", h.GetListUserTemplates)
	http.HandleFunc("POST /api/templates", h.PostCreateTemplate)
	http.HandleFunc("PUT /api/templates/{id}", h.PutUpdateTemplate)
	http.HandleFunc("DELETE /api/templates/{id}", h.DeleteTemplateById)
	http.HandleFunc("POST /api/templates/{id}/copy", h.PostCopyTemplateById)
	http.HandleFunc("GET /api/user/profile", h.GetProfile)
	http.HandleFunc("PUT /api/user/profile", h.PutUpdateProfile)
	http.HandleFunc("PUT /api/user/password", h.PutChangePassword)
	http.HandleFunc("DELETE /api/user", h.DeleteAccount)
	http.HandleFunc("GET /api/user/stats", h.GetUserStats)
	http.HandleFunc("POST /api/upload", h.PostUploadCheck)
	http.HandleFunc("GET /api/categories", h.GetListCategories)
	http.HandleFunc("GET /api/categories/by-name", h.GetCategoryByName)
	http.HandleFunc("POST /api/categories", h.PostCreateCategory)
	http.HandleFunc("DELETE /api/categories/{id}", h.DeleteCategoryById)
	http.HandleFunc("GET /api/categories/by-product", h.GetCategoryByProductNameOrCreateUndefined)

	http.ListenAndServe(":8080", nil)
}
