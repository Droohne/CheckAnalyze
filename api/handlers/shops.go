package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"CheckAnalyze/database/sqlc"
)

func (h *Handlers) GetListShops(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	shops, err := h.DB.ListShops(ctx)
	if err != nil {
		http.Error(w, "Failed to list stores: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shops)
}

func (h *Handlers) GetNearbyShopsByAddress(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	lat := r.URL.Query().Get("lat")
	lng := r.URL.Query().Get("lng")
	radius := r.URL.Query().Get("radius")

	if lat == "" || lng == "" {
		http.Error(w, "lat and lng required", http.StatusBadRequest)
		return
	}

	latFloat, _ := strconv.ParseFloat(lat, 64)
	lngFloat, _ := strconv.ParseFloat(lng, 64)
	radiusFloat := 5.0
	if radius != "" {
		radiusFloat, _ = strconv.ParseFloat(radius, 64)
	}

	shops, err := h.DB.GetShopsNearby(ctx, sqlc.GetShopsNearbyParams{
		LatParam:    latFloat,
		LngParam:    lngFloat,
		RadiusParam: radiusFloat,
		LimitParam:  10,
	})
	if err != nil {
		http.Error(w, "Failed to find nearby shops: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shops)
}

//TODO: Сравнивать по имени продукта на не по этомук нейровысеру?
func (h *Handlers) PostCompareShopsOnTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Products []string `json:"products"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if len(req.Products) == 0 {
		http.Error(w, "products required", http.StatusBadRequest)
		return
	}

	shops, err := h.DB.CompareShopsByTemplate(ctx, req.Products)
	if err != nil {
		http.Error(w, "Failed to compare shops: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shops)
}
