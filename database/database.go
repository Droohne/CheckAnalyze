package database

import (
    "context"
    "fmt"
    "time"

    "check_scan/config"
    "check_scan/models"

    "github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
    pool *pgxpool.Pool
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

        // Create new database
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
        
        config, err := pgxpool.ParseConfig(connStr)
        if err != nil {
            fmt.Printf("⏳ Error parsing config on attempt %d: %v\n", attempt, err)
            time.Sleep(2 * time.Second)
            continue
        }
        
        d.pool, err = pgxpool.NewWithConfig(ctx, config)
        if err == nil {
            err = d.pool.Ping(ctx)
            if err == nil {
                if err := d.createTables(); err != nil {
                    return fmt.Errorf("failed to create tables: %w", err)
                }
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

func (d *Database) createTables() error {
    ctx := context.Background()
    
    queries := []string{
        `CREATE TABLE IF NOT EXISTS checks (
            id SERIAL PRIMARY KEY,
            check_id VARCHAR(50) UNIQUE NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS product_names (
            id SERIAL PRIMARY KEY,
            product_name_string TEXT UNIQUE NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES product_names(id),
            check_id INTEGER REFERENCES checks(id),
            price_per_unit DECIMAL(10,2),
            amount_or_weight DECIMAL(10,3),
            UNIQUE(product_id, check_id)
        )`,
    }

    for _, query := range queries {
        if _, err := d.pool.Exec(ctx, query); err != nil {
            return fmt.Errorf("failed to execute query: %w", err)
        }
    }

    return nil
}

func (d *Database) GetOrCreateCheck(checkID, filename string) (int, error) {
    ctx := context.Background()
    var id int
    
    err := d.pool.QueryRow(ctx,
        `INSERT INTO checks (check_id, file_name) 
         VALUES ($1, $2) 
         ON CONFLICT (check_id) DO UPDATE SET check_id = checks.check_id 
         RETURNING id`,
        checkID, filename,
    ).Scan(&id)

    if err == nil {
        return id, nil
    }

    err = d.pool.QueryRow(ctx,
        "SELECT id FROM checks WHERE check_id = $1",
        checkID,
    ).Scan(&id)

    return id, err
}

func (d *Database) GetOrCreateProductName(productName string) (int, error) {
    ctx := context.Background()
    var id int
    
    err := d.pool.QueryRow(ctx,
        `INSERT INTO product_names (product_name_string) 
         VALUES ($1) 
         ON CONFLICT (product_name_string) DO UPDATE SET product_name_string = product_names.product_name_string 
         RETURNING id`,
        productName,
    ).Scan(&id)

    if err == nil {
        return id, nil
    }

    err = d.pool.QueryRow(ctx,
        "SELECT id FROM product_names WHERE product_name_string = $1",
        productName,
    ).Scan(&id)

    return id, err
}

func (d *Database) SaveProductToCheck(productID, checkID int, price, quantity float64) error {
    ctx := context.Background()
    _, err := d.pool.Exec(ctx,
        `INSERT INTO products (product_id, check_id, price_per_unit, amount_or_weight)
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (product_id, check_id) DO NOTHING`,
        productID, checkID, price, quantity,
    )
    return err
}

func (d *Database) GetStats() (*models.DBStats, error) {
    ctx := context.Background()
    stats := &models.DBStats{}

    if err := d.pool.QueryRow(ctx, "SELECT COUNT(*) FROM checks").Scan(&stats.Checks); err != nil {
        return nil, fmt.Errorf("failed to get checks count: %w", err)
    }

    if err := d.pool.QueryRow(ctx, "SELECT COUNT(*) FROM product_names").Scan(&stats.Products); err != nil {
        return nil, fmt.Errorf("failed to get products count: %w", err)
    }

    if err := d.pool.QueryRow(ctx, "SELECT COUNT(*) FROM products").Scan(&stats.Total); err != nil {
        return nil, fmt.Errorf("failed to get total count: %w", err)
    }

    return stats, nil
}

func (d *Database) Close() error {
    if d.pool != nil {
        d.pool.Close()
    }
    return nil
}