package project

import (
	"errors"
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
