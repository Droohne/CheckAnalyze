package schema

import (
    "entgo.io/ent"
    "entgo.io/ent/schema/edge"
    "entgo.io/ent/schema/field"
)

type Check struct {
    ent.Schema
}

func (Check) Fields() []ent.Field {
    return []ent.Field{
        field.String("check_id").Unique(),
        field.String("file_name"),
        field.Time("created_at").Optional(),
    }
}

func (Check) Edges() []ent.Edge {
    return []ent.Edge{
        edge.To("products", Product.Type),
    }
}