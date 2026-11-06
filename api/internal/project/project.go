// Package project implements the project management feature.
package project

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg" // Registers the JPEG format used to recognize covers.
	_ "image/png"  // Registers the PNG format used to recognize covers.
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
	maxCoverBytes  = 5 << 20
)

// Validation error codes. They are part of the API contract.
const (
	CodeMinWords         = "min_words"
	CodeMaxLength        = "max_length"
	CodeInvalidDate      = "invalid_date"
	CodeInvalidDateRange = "invalid_date_range"
	CodeInvalidImage     = "invalid_image"
	CodeMaxSize          = "max_size"
)

var (
	// ErrNotFound means the requested project does not exist.
	ErrNotFound = errors.New("project not found")
	// ErrCoverNotFound means the requested project has no cover.
	ErrCoverNotFound = errors.New("cover not found")
)

// coverContentTypes lists the accepted image formats.
var coverContentTypes = map[string]string{
	"jpeg": "image/jpeg",
	"png":  "image/png",
}

var idPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// Project is a stored project.
type Project struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Client    string    `json:"client"`
	StartDate Date      `json:"start_date"`
	EndDate   Date      `json:"end_date"`
	Favorite  bool      `json:"favorite"`
	CoverURL  *string   `json:"cover_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Sort is the order of a list (ADR-0029).
type Sort string

// Orders accepted by the list. SortName is the default.
const (
	SortName     Sort = "name"
	SortRecent   Sort = "recent"
	SortDeadline Sort = "deadline"
)

// ListFilter narrows and orders the projects returned by a list. The total
// always counts every registered project.
type ListFilter struct {
	FavoritesOnly bool
	Sort          Sort
	// Query keeps the projects whose name contains it, ignoring case and accents.
	Query string
}

// Input holds the values sent by a client. The dates stay as text until
// Validate, so an invalid date becomes a field error instead of a decode error.
// Cover stays out of the JSON format, and nil means that no file was sent.
type Input struct {
	Name        string `json:"name"`
	Client      string `json:"client"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Cover       []byte `json:"-"`
	RemoveCover bool   `json:"-"`
}

// Fields holds validated values, ready to be stored. Cover is nil when there is
// no new cover. RemoveCover only applies when there is none, and otherwise the
// current cover stays.
type Fields struct {
	Name        string
	Client      string
	StartDate   Date
	EndDate     Date
	Cover       *Cover
	RemoveCover bool
}

// Cover is a validated image.
type Cover struct {
	Content     []byte
	ContentType string
}

// StoredCover is a cover read from the database. Version changes whenever the
// image changes, so a URL that carries it can be cached.
type StoredCover struct {
	Cover
	Version string
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

	var coverErr *FieldError
	fields.Cover, coverErr = parseCover(in.Cover)
	if coverErr != nil {
		errs = append(errs, *coverErr)
	}
	fields.RemoveCover = in.RemoveCover && in.Cover == nil

	if len(errs) > 0 {
		return Fields{}, &ValidationError{Errors: errs}
	}
	return fields, nil
}

// parseCover identifies the format by the content of the file, because the name
// and the type sent by the client can be anything.
func parseCover(content []byte) (*Cover, *FieldError) {
	if content == nil {
		return nil, nil
	}
	if len(content) > maxCoverBytes {
		return nil, &FieldError{Field: "cover", Code: CodeMaxSize}
	}

	_, format, err := image.DecodeConfig(bytes.NewReader(content))
	if err != nil {
		return nil, &FieldError{Field: "cover", Code: CodeInvalidImage}
	}
	contentType, ok := coverContentTypes[format]
	if !ok {
		return nil, &FieldError{Field: "cover", Code: CodeInvalidImage}
	}
	return &Cover{Content: content, ContentType: contentType}, nil
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
