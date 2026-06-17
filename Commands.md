

Чтобы создать МИГРАЦИЮ ИЗ УЖЕ СУЩЕСТВУЮЩЕЙ БАЗЫ через atlas + golang-migrate 

psql -U postgres -c "CREATE DATABASE atlas_dev;" 

atlas migrate diff initial \
  --dir "file://migrations" \
  --to "postgres://postgres:postgres@localhost:5432/Products?sslmode=disable" \
  --dev-url "postgres://postgres:postgres@localhost:5432/atlas_dev?sslmode=disable"

Создать схему базы из ent моделей (сначала заполнить ent/schema)

go run -mod=mod entgo.io/ent/cmd/ent generate ./ent/schema

Сгенерировать модель по схеме
atlas migrate diff init --dir "file://migrations" --to "ent://./ent/schema" --dev-url "docker://postgres/18/dev"

Если база не создана, то создать ее, если создана то просто применить
atlas migrate apply --dir "file://migrations" --url "postgres://postgres:postgres@localhost:5432/Products?sslmode=disable"
