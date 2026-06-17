package schema

import (
    "entgo.io/ent"
    "entgo.io/ent/schema/edge"
    "entgo.io/ent/schema/field"
)

type ProductName struct {
    ent.Schema
}

func (ProductName) Fields() []ent.Field {
    return []ent.Field{
        field.String("name").Unique(),
    }
}

func (ProductName) Edges() []ent.Edge {
    return []ent.Edge{
        edge.To("products", Product.Type),
    }
}