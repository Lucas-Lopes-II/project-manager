// Package project implements the project management feature.
package project

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"
)

const (
	minNameWords   = 2
	minClientWords = 1
	maxTextLength  = 120
)

// Validation error codes. They are part of the API contract.
const (
	CodeMinWords         = "min_words"
	CodeMaxLength        = "max_length"
	CodeInvalidDate      = "invalid_date"
	CodeInvalidDateRange = "invalid_date_range"
)

// ErrNotFound means the requested project does not exist.
var ErrNotFound = errors.New("project not found")

var idPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// Project is a stored project.
type Project struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Client    string    `json:"client"`
	StartDate Date      `json:"start_date"`
	EndDate   Date      `json:"end_date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Input holds the values sent by a client. The dates stay as text until
// Validate, so an invalid date becomes a field error instead of a decode error.
type Input struct {
	Name      string `json:"name"`
	Client    string `json:"client"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

// Fields holds validated values, ready to be stored.
type Fields struct {
	Name      string
	Client    string
	StartDate Date
	EndDate   Date
}

// FieldError points to an invalid field.
type FieldError struct {
	Field string
	Code  string
}

// ValidationError lists every invalid field of an Input.
type ValidationError struct {
	Errors []FieldError
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("invalid project: %d field errors", len(e.Errors))
}

// Validate applies the rules from ADR-0012 and returns a *ValidationError when
// any field is invalid.
func (in Input) Validate() (Fields, error) {
	fields := Fields{
		Name:   normalizeText(in.Name),
		Client: normalizeText(in.Client),
	}

	var errs []FieldError
	errs = append(errs, validateText("name", fields.Name, minNameWords)...)
	errs = append(errs, validateText("client", fields.Client, minClientWords)...)

	var startErr, endErr error
	fields.StartDate, startErr = ParseDate(in.StartDate)
	fields.EndDate, endErr = ParseDate(in.EndDate)

	if startErr != nil {
		errs = append(errs, FieldError{Field: "start_date", Code: CodeInvalidDate})
	}
	if endErr != nil {
		errs = append(errs, FieldError{Field: "end_date", Code: CodeInvalidDate})
	}
	if startErr == nil && endErr == nil && !fields.EndDate.After(fields.StartDate) {
		errs = append(errs,
			FieldError{Field: "start_date", Code: CodeInvalidDateRange},
			FieldError{Field: "end_date", Code: CodeInvalidDateRange},
		)
	}

	if len(errs) > 0 {
		return Fields{}, &ValidationError{Errors: errs}
	}
	return fields, nil
}

// normalizeText trims the text and collapses repeated spaces. It also removes
// NUL characters, which PostgreSQL does not accept in text columns.
func normalizeText(text string) string {
	return strings.Join(strings.Fields(strings.ReplaceAll(text, "\x00", "")), " ")
}

func validateText(field, text string, minWords int) []FieldError {
	var errs []FieldError
	if countWords(text) < minWords {
		errs = append(errs, FieldError{Field: field, Code: CodeMinWords})
	}
	if utf8.RuneCountInString(text) > maxTextLength {
		errs = append(errs, FieldError{Field: field, Code: CodeMaxLength})
	}
	return errs
}

// countWords counts the space-separated parts that have a letter or a number.
func countWords(text string) int {
	count := 0
	for _, part := range strings.Fields(text) {
		if strings.IndexFunc(part, isLetterOrNumber) >= 0 {
			count++
		}
	}
	return count
}

func isLetterOrNumber(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsNumber(r)
}
