package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"CheckAnalyze/database/sqlc"
)

func (h *Handlers) GetListShops(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	shops, err := h.DB.ListShops(ctx)
	if err != nil {
		slog.Error("failed to list shops", "error", err)
		http.Error(w, "Failed to list stores: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(shops); err != nil {
		slog.Error("failed to encode shops response", "error", err)
	}
}

func (h *Handlers) GetNearbyShopsByAddress(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	lat := r.URL.Query().Get("lat")
	lng := r.URL.Query().Get("lng")
	radius := r.URL.Query().Get("radius")

	if lat == "" || lng == "" {
		slog.Warn("nearby shops: missing lat/lng")
		http.Error(w, "lat and lng required", http.StatusBadRequest)
		return
	}

	latFloat, err := strconv.ParseFloat(lat, 64)
	if err != nil {
		slog.Warn("nearby shops: invalid lat", "lat", lat, "error", err)
		http.Error(w, "invalid lat", http.StatusBadRequest)
		return
	}

	lngFloat, err := strconv.ParseFloat(lng, 64)
	if err != nil {
		slog.Warn("nearby shops: invalid lng", "lng", lng, "error", err)
		http.Error(w, "invalid lng", http.StatusBadRequest)
		return
	}

	radiusFloat := 5.0
	if radius != "" {
		radiusFloat, err = strconv.ParseFloat(radius, 64)
		if err != nil {
			slog.Warn("nearby shops: invalid radius", "radius", radius, "error", err)
			http.Error(w, "invalid radius", http.StatusBadRequest)
			return
		}
	}

	shops, err := h.DB.GetShopsNearby(ctx, sqlc.GetShopsNearbyParams{
		LatParam:    latFloat,
		LngParam:    lngFloat,
		RadiusParam: radiusFloat,
		LimitParam:  10,
	})
	if err != nil {
		slog.Error("failed to find nearby shops",
			"lat", latFloat, "lng", lngFloat, "radius", radiusFloat, "error", err)
		http.Error(w, "Failed to find nearby shops: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Debug("nearby shops found",
		"lat", latFloat, "lng", lngFloat, "radius", radiusFloat, "count", len(shops))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(shops); err != nil {
		slog.Error("failed to encode nearby shops response", "error", err)
	}
}

func (h *Handlers) PostCompareShopsOnTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Products []string `json:"products"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("compare shops: invalid JSON", "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if len(req.Products) == 0 {
		slog.Warn("compare shops: no products provided")
		http.Error(w, "products required", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.CompareShopsByTemplateWithBreakdown(ctx, req.Products)
	if err != nil {
		slog.Error("failed to compare shops", "products", len(req.Products), "error", err)
		http.Error(w, "Failed to compare shops: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Debug("shops compared", "products", len(req.Products), "results", len(rows))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(rows); err != nil {
		slog.Error("failed to encode compare shops response", "error", err)
	}
}
