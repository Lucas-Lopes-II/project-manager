package project

import (
	"encoding/json"
	"testing"
)

func TestParseDate(t *testing.T) {
	tests := []struct {
		value   string
		wantErr bool
	}{
		{value: "2026-11-04"},
		{value: "2028-02-29"},
		{value: "2026-02-30", wantErr: true},
		{value: "2026-13-01", wantErr: true},
		{value: "04/11/2026", wantErr: true},
		{value: "2026-11-04T00:00:00Z", wantErr: true},
		{value: "", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.value, func(t *testing.T) {
			date, err := ParseDate(tt.value)

			if tt.wantErr {
				if err == nil {
					t.Fatalf("ParseDate(%q) = %v, want an error", tt.value, date)
				}
				return
			}
			if err != nil {
				t.Fatalf("ParseDate(%q) unexpected error: %v", tt.value, err)
			}
			if got := date.String(); got != tt.value {
				t.Errorf("String() = %q, want %q", got, tt.value)
			}
		})
	}
}

func TestDate_After(t *testing.T) {
	earlier := mustParseDate(t, "2026-11-04")
	later := mustParseDate(t, "2026-11-05")

	if !later.After(earlier) {
		t.Error("later.After(earlier) = false, want true")
	}
	if earlier.After(later) {
		t.Error("earlier.After(later) = true, want false")
	}
	if earlier.After(earlier) {
		t.Error("earlier.After(earlier) = true, want false")
	}
}

func TestDate_MarshalJSON(t *testing.T) {
	got, err := json.Marshal(mustParseDate(t, "2026-11-04"))
	if err != nil {
		t.Fatalf("Marshal() error = %v", err)
	}
	if string(got) != `"2026-11-04"` {
		t.Errorf("Marshal() = %s", got)
	}
}

func mustParseDate(t *testing.T, value string) Date {
	t.Helper()

	date, err := ParseDate(value)
	if err != nil {
		t.Fatalf("ParseDate(%q) error = %v", value, err)
	}
	return date
}
