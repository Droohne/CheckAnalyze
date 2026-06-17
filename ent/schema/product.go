package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Product struct {
	ent.Schema
}

func (Product) Fields() []ent.Field {
    return []ent.Field{
        field.Int("check_id"),    
        field.Int("product_id"),  
        field.Float("price"),
        field.Float("quantity"),
    }
}

func (Product) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("check", Check.Type).
			Ref("products").
			Field("check_id").
			Unique().
			Required(),
		edge.From("product_name", ProductName.Type).
			Ref("products").
			Field("product_id").
			Unique().
			Required(),
	}
}
