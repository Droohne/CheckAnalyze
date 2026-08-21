package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"CheckAnalyze/database/sqlc"
)

func (h *Handlers) GetListTemplates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	templates, err := h.DB.ListTemplates(ctx)
	if err != nil {
		slog.Error("failed to list templates", "error", err)
		http.Error(w, "Failed to list templates: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(templates); err != nil {
		slog.Error("failed to encode templates response", "error", err)
	}
}

func (h *Handlers) GetListDefaultTemplates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rows, err := h.DB.ListDefaultTemplates(ctx)
	if err != nil {
		slog.Error("failed to list default templates", "error", err)
		http.Error(w, "Failed to list default templates: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := groupTemplateRows(rows)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		slog.Error("failed to encode default templates response", "error", err)
	}
}

func (h *Handlers) GetListUserTemplates(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var userID int32 = 1

	rows, err := h.DB.ListUserTemplates(ctx, userID)
	if err != nil {
		slog.Error("failed to list user templates", "user_id", userID, "error", err)
		http.Error(w, "Failed to list user templates: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := groupTemplateRows(rows)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		slog.Error("failed to encode user templates response", "user_id", userID, "error", err)
	}
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
		slog.Warn("get template: missing id")
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("get template: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	template, err := h.DB.GetTemplateByID(ctx, int32(id))
	if err != nil {
		slog.Warn("template not found", "template_id", id, "error", err)
		http.Error(w, "Template not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(template); err != nil {
		slog.Error("failed to encode template response", "template_id", id, "error", err)
	}
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
		slog.Warn("create template: invalid JSON", "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		slog.Warn("create template: missing name")
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
		slog.Error("failed to create template", "user_id", userID, "name", req.Name, "error", err)
		http.Error(w, "Failed to create template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, p := range req.Products {
		amount := p.AmountOrWeight
		if amount == 0 {
			amount = 1.0
		}
		if err := h.DB.AddProductToTemplate(ctx, sqlc.AddProductToTemplateParams{
			TemplateID:     template.ID,
			ProductNameID:  p.ProductNameID,
			AmountOrWeight: amount,
		}); err != nil {
			slog.Error("failed to add product to new template",
				"template_id", template.ID, "product_name_id", p.ProductNameID, "error", err)
		}
	}

	slog.Info("template created", "template_id", template.ID, "user_id", userID, "products", len(req.Products))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(template); err != nil {
		slog.Error("failed to encode create template response", "template_id", template.ID, "error", err)
	}
}

func (h *Handlers) PutUpdateTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("update template: missing id")
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("update template: invalid id", "id", idStr, "error", err)
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
		slog.Warn("update template: invalid JSON", "template_id", id, "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		slog.Warn("update template: missing name", "template_id", id)
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
		slog.Error("failed to update template", "template_id", id, "user_id", userID, "error", err)
		http.Error(w, "Failed to update template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := h.DB.RemoveAllProductsFromTemplate(ctx, int32(id)); err != nil {
		slog.Error("failed to clear products before update", "template_id", id, "error", err)
	}
	for _, p := range req.Products {
		amount := p.AmountOrWeight
		if amount == 0 {
			amount = 1.0
		}
		if err := h.DB.AddProductToTemplate(ctx, sqlc.AddProductToTemplateParams{
			TemplateID:     int32(id),
			ProductNameID:  p.ProductNameID,
			AmountOrWeight: amount,
		}); err != nil {
			slog.Error("failed to add product during template update",
				"template_id", id, "product_name_id", p.ProductNameID, "error", err)
		}
	}

	slog.Info("template updated", "template_id", id, "user_id", userID, "products", len(req.Products))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(template); err != nil {
		slog.Error("failed to encode update template response", "template_id", id, "error", err)
	}
}

func (h *Handlers) DeleteTemplateById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("delete template: missing id")
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("delete template: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	if err := h.DB.DeleteTemplate(ctx, int32(id)); err != nil {
		slog.Error("failed to delete template", "template_id", id, "error", err)
		http.Error(w, "Failed to delete template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("template deleted", "template_id", id)

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) PostCopyTemplateById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("copy template: missing id")
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("copy template: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("copy template: invalid JSON", "template_id", id, "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		slog.Warn("copy template: missing name", "template_id", id)
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
		slog.Error("failed to copy template", "source_template_id", id, "user_id", userID, "error", err)
		http.Error(w, "Failed to copy template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	template, err := h.DB.GetTemplateByID(ctx, newTemplateID)
	if err != nil {
		slog.Error("failed to get copied template", "new_template_id", newTemplateID, "error", err)
		http.Error(w, "Failed to get copied template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("template copied", "source_template_id", id, "new_template_id", newTemplateID, "user_id", userID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(template); err != nil {
		slog.Error("failed to encode copy template response", "new_template_id", newTemplateID, "error", err)
	}
}

func (h *Handlers) GetTemplateWithProducts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("get template with products: missing id")
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("get template with products: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	templateWithProducts, err := h.DB.GetTemplateWithProducts(ctx, int32(id))
	if err != nil {
		slog.Error("failed to get template with products", "template_id", id, "error", err)
		http.Error(w, "Failed to get template with products: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(templateWithProducts); err != nil {
		slog.Error("failed to encode template with products response", "template_id", id, "error", err)
	}
}

func (h *Handlers) PostAddProductToTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("add product to template: missing template id")
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("add product to template: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	var req struct {
		ProductNameID  int32   `json:"product_name_id"`
		AmountOrWeight float64 `json:"amount_or_weight"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("add product to template: invalid JSON", "template_id", id, "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.ProductNameID == 0 {
		slog.Warn("add product to template: missing product_name_id", "template_id", id)
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
		slog.Error("failed to add product to template",
			"template_id", id, "product_name_id", req.ProductNameID, "error", err)
		http.Error(w, "Failed to add product to template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("product added to template", "template_id", id, "product_name_id", req.ProductNameID)

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) DeleteRemoveProductFromTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("remove product from template: missing template id")
		http.Error(w, "template id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("remove product from template: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid template id", http.StatusBadRequest)
		return
	}

	productIDStr := r.URL.Query().Get("product_name_id")
	if productIDStr == "" {
		slog.Warn("remove product from template: missing product_name_id", "template_id", id)
		http.Error(w, "product_name_id required", http.StatusBadRequest)
		return
	}

	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		slog.Warn("remove product from template: invalid product_name_id", "template_id", id, "product_name_id", productIDStr, "error", err)
		http.Error(w, "invalid product_name_id", http.StatusBadRequest)
		return
	}

	err = h.DB.RemoveProductFromTemplate(ctx, sqlc.RemoveProductFromTemplateParams{
		TemplateID:    int32(id),
		ProductNameID: int32(productID),
	})
	if err != nil {
		slog.Error("failed to remove product from template",
			"template_id", id, "product_name_id", productID, "error", err)
		http.Error(w, "Failed to remove product from template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("product removed from template", "template_id", id, "product_name_id", productID)

	w.WriteHeader(http.StatusNoContent)
}
