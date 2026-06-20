// parser/normalizer.go
package parser

import (
	"regexp"
	"strings"
)

var (
	multiSpace = regexp.MustCompile(`\s+`)

	// Normalize weight suffixes: "вес 1кг", "вес 1 кг", "1кг", "1 кг" → "1кг"
	weightSuffix = regexp.MustCompile(`\s*(вес\s*)?(\d+[\.,]?\d*\s*кг)$`)

	// Normalize "г.Пермь" vs "г. Пермь"
	dotSpace = regexp.MustCompile(`\.(\S)`)
)

func NormalizeProductName(name string) string {
	n := strings.TrimSpace(name)

	// Only remove "вес" when it's a standalone word (word boundary)
	n = regexp.MustCompile(`\s+вес\s+`).ReplaceAllString(n, " ")
	// Also remove "вес" at the end of string
	n = regexp.MustCompile(`\s+вес$`).ReplaceAllString(n, "")
	// Also remove "вес" at the start (unlikely but safe)
	n = regexp.MustCompile(`^вес\s+`).ReplaceAllString(n, "")

	// Replace tabs, newlines, multiple spaces with single space
	n = multiSpace.ReplaceAllString(n, " ")

	// Normalize weight: "Бананы вес 1кг" → "Бананы 1кг"
	// Keep the weight as part of name since it differentiates products
	// But normalize the format
	n = weightSuffix.ReplaceAllString(n, " ${2}")

	// Fix "1 кг" → "1кг"
	n = regexp.MustCompile(`(\d)\s+кг`).ReplaceAllString(n, "${1}кг")

	return n
}
