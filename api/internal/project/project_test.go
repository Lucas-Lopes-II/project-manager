package project

import (
	"bytes"
	"errors"
	"image"
	"image/jpeg"
	"image/png"
	"reflect"
	"strings"
	"testing"
)

func validInput() Input {
	return Input{
		Name:      "Projeto Iridium",
		Client:    "Clicksign",
		StartDate: "2026-11-04",
		EndDate:   "2026-12-12",
	}
}

func TestInput_Validate_ReportsInvalidFields(t *testing.T) {
	tests := []struct {
		name   string
		change func(*Input)
		want   []FieldError
	}{
		{
			name:   "name with one word",
			change: func(in *Input) { in.Name = "Iridium" },
			want:   []FieldError{{Field: "name", Code: CodeMinWords}},
		},
		{
			name:   "empty name",
			change: func(in *Input) { in.Name = "   " },
			want:   []FieldError{{Field: "name", Code: CodeMinWords}},
		},
		{
			name:   "symbols do not count as words",
			change: func(in *Input) { in.Name = "Iridium -" },
			want:   []FieldError{{Field: "name", Code: CodeMinWords}},
		},
		{
			name:   "name above the length limit",
			change: func(in *Input) { in.Name = "a " + strings.Repeat("b", maxTextLength) },
			want:   []FieldError{{Field: "name", Code: CodeMaxLength}},
		},
		{
			name:   "empty client",
			change: func(in *Input) { in.Client = "" },
			want:   []FieldError{{Field: "client", Code: CodeMinWords}},
		},
		{
			name:   "client above the length limit",
			change: func(in *Input) { in.Client = strings.Repeat("c", maxTextLength+1) },
			want:   []FieldError{{Field: "client", Code: CodeMaxLength}},
		},
		{
			name:   "invalid start date",
			change: func(in *Input) { in.StartDate = "04/11/2026" },
			want:   []FieldError{{Field: "start_date", Code: CodeInvalidDate}},
		},
		{
			name:   "missing end date",
			change: func(in *Input) { in.EndDate = "" },
			want:   []FieldError{{Field: "end_date", Code: CodeInvalidDate}},
		},
		{
			name:   "end date equal to the start date",
			change: func(in *Input) { in.EndDate = in.StartDate },
			want: []FieldError{
				{Field: "start_date", Code: CodeInvalidDateRange},
				{Field: "end_date", Code: CodeInvalidDateRange},
			},
		},
		{
			name:   "end date before the start date",
			change: func(in *Input) { in.EndDate = "2026-11-03" },
			want: []FieldError{
				{Field: "start_date", Code: CodeInvalidDateRange},
				{Field: "end_date", Code: CodeInvalidDateRange},
			},
		},
		{
			name:   "every invalid field at once",
			change: func(in *Input) { *in = Input{} },
			want: []FieldError{
				{Field: "name", Code: CodeMinWords},
				{Field: "client", Code: CodeMinWords},
				{Field: "start_date", Code: CodeInvalidDate},
				{Field: "end_date", Code: CodeInvalidDate},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := validInput()
			tt.change(&in)

			_, err := in.Validate()

			var validation *ValidationError
			if !errors.As(err, &validation) {
				t.Fatalf("Validate() error = %v, want a *ValidationError", err)
			}
			if !reflect.DeepEqual(validation.Errors, tt.want) {
				t.Errorf("Errors = %+v, want %+v", validation.Errors, tt.want)
			}
		})
	}
}

func TestInput_Validate_AcceptsValidValues(t *testing.T) {
	tests := []struct {
		name   string
		change func(*Input)
	}{
		{"complete input", func(*Input) {}},
		{"name with accents", func(in *Input) { in.Name = "Área Comercial" }},
		{"name with a number", func(in *Input) { in.Name = "Projeto 01" }},
		{"name at the length limit", func(in *Input) { in.Name = "a " + strings.Repeat("b", maxTextLength-2) }},
		{"length counts characters, not bytes", func(in *Input) { in.Client = strings.Repeat("á", maxTextLength) }},
		{"dates in the past", func(in *Input) { in.StartDate, in.EndDate = "2000-01-01", "2000-01-02" }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := validInput()
			tt.change(&in)

			if _, err := in.Validate(); err != nil {
				t.Errorf("Validate() error = %v", err)
			}
		})
	}
}

func TestInput_Validate_NormalizesText(t *testing.T) {
	in := validInput()
	in.Name = "  Projeto \t  Iridium\x00 "
	in.Client = " Click  sign "

	fields, err := in.Validate()
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}

	if fields.Name != "Projeto Iridium" {
		t.Errorf("Name = %q", fields.Name)
	}
	if fields.Client != "Click sign" {
		t.Errorf("Client = %q", fields.Client)
	}
}

func TestInput_Validate_AcceptsCovers(t *testing.T) {
	tests := []struct {
		name        string
		content     []byte
		contentType string
	}{
		{name: "PNG", content: testPNG(t), contentType: "image/png"},
		{name: "JPEG", content: testJPEG(t), contentType: "image/jpeg"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := validInput()
			in.Cover = tt.content

			fields, err := in.Validate()
			if err != nil {
				t.Fatalf("Validate() error = %v", err)
			}
			if fields.Cover == nil || fields.Cover.ContentType != tt.contentType {
				t.Errorf("Cover = %+v, want %s", fields.Cover, tt.contentType)
			}
		})
	}
}

func TestInput_Validate_CoverIsOptional(t *testing.T) {
	fields, err := validInput().Validate()
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if fields.Cover != nil {
		t.Errorf("Cover = %+v, want nil", fields.Cover)
	}
}

func TestInput_Validate_RejectsInvalidCovers(t *testing.T) {
	tooLarge := append(testPNG(t), make([]byte, maxCoverBytes)...)

	tests := []struct {
		name    string
		content []byte
		code    string
	}{
		{name: "not an image", content: []byte("not an image"), code: CodeInvalidImage},
		{name: "empty file", content: []byte{}, code: CodeInvalidImage},
		{name: "GIF", content: []byte("GIF89a\x01\x00\x01\x00\x00\x00\x00"), code: CodeInvalidImage},
		{name: "above the limit", content: tooLarge, code: CodeMaxSize},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := validInput()
			in.Cover = tt.content

			_, err := in.Validate()

			var validation *ValidationError
			if !errors.As(err, &validation) {
				t.Fatalf("Validate() error = %v, want a ValidationError", err)
			}
			want := []FieldError{{Field: "cover", Code: tt.code}}
			if !reflect.DeepEqual(validation.Errors, want) {
				t.Errorf("errors = %+v, want %+v", validation.Errors, want)
			}
		})
	}
}

func TestInput_Validate_RemoveCover(t *testing.T) {
	in := validInput()
	in.RemoveCover = true

	fields, err := in.Validate()
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if !fields.RemoveCover {
		t.Error("RemoveCover = false, want true")
	}

	in.Cover = testPNG(t)

	fields, err = in.Validate()
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
	if fields.RemoveCover || fields.Cover == nil {
		t.Errorf("Fields = %+v, want the new file to win", fields)
	}
}

func TestParseCover_AcceptsTheSizeLimit(t *testing.T) {
	png := testPNG(t)
	content := append(png, make([]byte, maxCoverBytes-len(png))...)

	cover, fieldErr := parseCover(content)
	if fieldErr != nil || cover == nil {
		t.Errorf("parseCover() = %+v, %+v, want a cover", cover, fieldErr)
	}
}

func testPNG(t *testing.T) []byte {
	t.Helper()

	var buffer bytes.Buffer
	if err := png.Encode(&buffer, image.NewRGBA(image.Rect(0, 0, 2, 2))); err != nil {
		t.Fatalf("encode PNG: %v", err)
	}
	return buffer.Bytes()
}

func testJPEG(t *testing.T) []byte {
	t.Helper()

	var buffer bytes.Buffer
	if err := jpeg.Encode(&buffer, image.NewRGBA(image.Rect(0, 0, 2, 2)), nil); err != nil {
		t.Fatalf("encode JPEG: %v", err)
	}
	return buffer.Bytes()
}
