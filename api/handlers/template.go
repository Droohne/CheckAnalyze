package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"CheckAnalyze/database/sqlc"
)

func (h *Handlers) GetListTemplates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	templates, err := h.DB.ListTemplates(ctx)
	if err != nil {
		http.Error(w, "Failed to list templates: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

func (h *Handlers) GetListDefaultTemplates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rows, err := h.DB.ListDefaultTemplates(ctx)
	if err != nil {
		http.Error(w, "Failed to list default templates: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := groupTemplateRows(rows)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *Handlers) GetListUserTemplates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var userID int32 = 1

	rows, err := h.DB.ListUserTemplates(ctx, userID)
	if err != nil {
		http.Error(w, "Failed to list user templates: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := groupTemplateRows(rows)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func groupTemplateRows(rows interface{}) interface{} {
	type Product struct {
		ID             int32   `json:"id"`
		ProductNameID  int32   `json:"product_name_id"`
		ProductName    string  `json:"product_name"`
		AmountOrWeight float64 `json:"amount_or_weight"`
	}
	type Template struct {
		ID        int32     `json:"id"`
		Name      string    `json:"name"`
		UserID    int32     `json:"user_id"`
		IsDefault bool      `json:"is_default"`
		CreatedAt string    `json:"created_at"`
		Products  []Product `json:"products"`
	}
	templateMap := make(map[int32]*Template)
	var order []int32

	switch r := rows.(type) {
	case []sqlc.ListDefaultTemplatesRow:
		for _, row := range r {
			t, ok := templateMap[row.ID]
			if !ok {
				t = &Template{
					ID:        row.ID,
					Name:      row.Name,
					UserID:    row.UserID.Int32,
					IsDefault: row.IsDefault.Bool,
					CreatedAt: row.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
					Products:  []Product{},
				}
				templateMap[row.ID] = t
				order = append(order, row.ID)
			}
			if row.ProductID.Valid {
				t.Products = append(t.Products, Product{
					ID:             row.TpID.Int32,
					ProductNameID:  row.ProductID.Int32,
					ProductName:    row.ProductName.String,
					AmountOrWeight: row.AmountOrWeight.Float64,
				})
			}
		}
	case []sqlc.ListUserTemplatesRow:
		for _, row := range r {
			t, ok := templateMap[row.ID]
			if !ok {
				t = &Template{
					ID:        row.ID,
					Name:      row.Name,
					UserID:    row.UserID.Int32,
					IsDefault: row.IsDefault.Bool,
					CreatedAt: row.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
					Products:  []Product{},
				}
				templateMap[row.ID] = t
				order = append(order, row.ID)
			}
			if row.ProductID.Valid {
				t.Products = append(t.Products, Product{
					ID:             row.TpID.Int32,
					ProductNameID:  row.ProductID.Int32,
					ProductName:    row.ProductName.String,
					AmountOrWeight: row.AmountOrWeight.Float64,
				})
			}
		}
	}

	result := make([]Template, len(order))
	for i, id := range order {
		result[i] = *templateMap[id]
	}
	return result
}

func (h *Handlers) GetTemplateById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	template, err := h.DB.GetTemplateByID(ctx, int32(id))
	if err != nil {
		http.Error(w, "Template not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

func (h *Handlers) PostCreateTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Name      string `json:"name"`
		IsDefault bool   `json:"is_default"`
		Products  []struct {
			ProductNameID  int32   `json:"product_name_id"`
			AmountOrWeight float64 `json:"amount_or_weight"`
		} `json:"products"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "template name required", http.StatusBadRequest)
		return
	}

	var userID int32 = 1

	template, err := h.DB.CreateTemplate(ctx, sqlc.CreateTemplateParams{
		Name:      req.Name,
		UserID:    userID,
		IsDefault: req.IsDefault,
	})
	if err != nil {
		http.Error(w, "Failed to create template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, p := range req.Products {
		amount := p.AmountOrWeight
		if amount == 0 {
			amount = 1.0
		}
		h.DB.AddProductToTemplate(ctx, sqlc.AddProductToTemplateParams{
			TemplateID:     template.ID,
			ProductNameID:  p.ProductNameID,
			AmountOrWeight: amount,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(template)
}

func (h *Handlers) PutUpdateTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	var req struct {
		Name      string `json:"name"`
		IsDefault bool   `json:"is_default"`
		Products  []struct {
			ProductNameID  int32   `json:"product_name_id"`
			AmountOrWeight float64 `json:"amount_or_weight"`
		} `json:"products"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "template name required", http.StatusBadRequest)
		return
	}

	var userID int32 = 1

	template, err := h.DB.UpdateTemplate(ctx, sqlc.UpdateTemplateParams{
		ID:        int32(id),
		Name:      req.Name,
		UserID:    userID,
		IsDefault: req.IsDefault,
	})
	if err != nil {
		http.Error(w, "Failed to update template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	h.DB.RemoveAllProductsFromTemplate(ctx, int32(id))
	for _, p := range req.Products {
		amount := p.AmountOrWeight
		if amount == 0 {
			amount = 1.0
		}
		h.DB.AddProductToTemplate(ctx, sqlc.AddProductToTemplateParams{
			TemplateID:     int32(id),
			ProductNameID:  p.ProductNameID,
			AmountOrWeight: amount,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

func (h *Handlers) DeleteTemplateById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	if err := h.DB.DeleteTemplate(ctx, int32(id)); err != nil {
		http.Error(w, "Failed to delete template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) PostCopyTemplateById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "template name required", http.StatusBadRequest)
		return
	}

	var userID int32 = 1

	newTemplateID, err := h.DB.CopyTemplate(ctx, sqlc.CopyTemplateParams{
		Name:       req.Name,
		UserID:     userID,
		TemplateID: int32(id),
	})
	if err != nil {
		http.Error(w, "Failed to copy template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	template, err := h.DB.GetTemplateByID(ctx, newTemplateID)
	if err != nil {
		http.Error(w, "Failed to get copied template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(template)
}

func (h *Handlers) GetTemplateWithProducts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	templateWithProducts, err := h.DB.GetTemplateWithProducts(ctx, int32(id))
	if err != nil {
		http.Error(w, "Failed to get template with products: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templateWithProducts)
}

func (h *Handlers) PostAddProductToTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	var req struct {
		ProductNameID  int32   `json:"product_name_id"`
		AmountOrWeight float64 `json:"amount_or_weight"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.ProductNameID == 0 {
		http.Error(w, "product_name_id required", http.StatusBadRequest)
		return
	}

	if req.AmountOrWeight == 0 {
		req.AmountOrWeight = 1.0
	}

	err = h.DB.AddProductToTemplate(ctx, sqlc.AddProductToTemplateParams{
		TemplateID:     int32(id),
		ProductNameID:  req.ProductNameID,
		AmountOrWeight: req.AmountOrWeight,
	})
	if err != nil {
		http.Error(w, "Failed to add product to template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) DeleteRemoveProductFromTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	productIDStr := r.URL.Query().Get("product_name_id")
	if productIDStr == "" {
		http.Error(w, "product_name_id required", http.StatusBadRequest)
		return
	}

	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		http.Error(w, "invalid product_name_id", http.StatusBadRequest)
		return
	}

	err = h.DB.RemoveProductFromTemplate(ctx, sqlc.RemoveProductFromTemplateParams{
		TemplateID:    int32(id),
		ProductNameID: int32(productID),
	})
	if err != nil {
		http.Error(w, "Failed to remove product from template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
