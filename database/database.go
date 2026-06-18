package database

import (
	"context"
	"fmt"
	"time"

	"CheckAnalyze/config"
	"CheckAnalyze/database/sqlc"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	pool *pgxpool.Pool
	*sqlc.Queries
}

func New() *Database {
	return &Database{}
}

func (d *Database) EnsureDatabaseExists() error {
	adminConfig := config.GetAdminConfig()
	targetDB := config.GetDBConfig().DBName

	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		adminConfig.User, adminConfig.Password,
		adminConfig.Host, adminConfig.Port,
		adminConfig.DBName,
	)

	ctx := context.Background()
	adminConn, err := pgxpool.New(ctx, connStr)
	if err != nil {
		return fmt.Errorf("failed to connect to admin DB: %w", err)
	}
	defer adminConn.Close()

	var exists bool
	err = adminConn.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_database WHERE datname = $1)",
		targetDB,
	).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check database existence: %w", err)
	}

	if !exists {
		rows, err := adminConn.Query(ctx, `
			SELECT datname FROM pg_catalog.pg_database 
			WHERE datname ILIKE $1 AND datname != 'postgres'
		`, targetDB)
		if err != nil {
			return fmt.Errorf("failed to query similar databases: %w", err)
		}

		var dbNames []string
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err != nil {
				rows.Close()
				return fmt.Errorf("failed to scan database name: %w", err)
			}
			dbNames = append(dbNames, name)
		}
		rows.Close()

		for _, name := range dbNames {
			fmt.Printf("🗑️  Removing: %s\n", name)
			if _, err := adminConn.Exec(ctx, fmt.Sprintf(`DROP DATABASE IF EXISTS "%s"`, name)); err != nil {
				return fmt.Errorf("failed to drop database %s: %w", name, err)
			}
		}

		if _, err := adminConn.Exec(ctx, fmt.Sprintf(`CREATE DATABASE "%s"`, targetDB)); err != nil {
			return fmt.Errorf("failed to create database %s: %w", targetDB, err)
		}
		fmt.Printf("✅ Database '%s' created\n", targetDB)
	} else {
		fmt.Printf("✅ Database '%s' exists\n", targetDB)
	}

	time.Sleep(1 * time.Second)
	return nil
}

func (d *Database) Connect() error {
	if err := d.EnsureDatabaseExists(); err != nil {
		return fmt.Errorf("failed to ensure database exists: %w", err)
	}

	cfg := config.GetDBConfig()
	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.User, cfg.Password,
		cfg.Host, cfg.Port,
		cfg.DBName,
	)

	ctx := context.Background()
	var err error
	for attempt := 1; attempt <= 5; attempt++ {
		fmt.Printf("🔄 Connecting attempt %d/5...\n", attempt)

		poolConfig, err := pgxpool.ParseConfig(connStr)
		if err != nil {
			fmt.Printf("⏳ Error parsing config on attempt %d: %v\n", attempt, err)
			time.Sleep(2 * time.Second)
			continue
		}

		d.pool, err = pgxpool.NewWithConfig(ctx, poolConfig)
		if err == nil {
			err = d.pool.Ping(ctx)
			if err == nil {
				if err := d.runMigrations(); err != nil {
					return fmt.Errorf("failed to run migrations: %w", err)
				}
				// Initialize sqlc queries
				d.Queries = sqlc.New(d.pool)
				fmt.Println("✅ Connected!")
				return nil
			}
		}
		fmt.Printf("⏳ Error on attempt %d: %v\n", attempt, err)
		if d.pool != nil {
			d.pool.Close()
		}
		time.Sleep(2 * time.Second)
	}

	return fmt.Errorf("failed to connect after 5 attempts: %w", err)
}

func (d *Database) runMigrations() error {
	cfg := config.GetDBConfig()
	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.User, cfg.Password,
		cfg.Host, cfg.Port,
		cfg.DBName,
	)

	m, err := migrate.New(
		"file://migrations",
		connStr,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrator: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration failed: %w", err)
	}

	fmt.Println("✅ Migrations applied")
	return nil
}

func (d *Database) Close() error {
	if d.pool != nil {
		d.pool.Close()
	}
	return nil
}