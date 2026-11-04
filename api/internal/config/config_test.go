package config

import (
	"strings"
	"testing"
)

func TestLoad(t *testing.T) {
	tests := []struct {
		name    string
		env     map[string]string
		want    Config
		wantErr string
	}{
		{
			name: "uses the values from the environment",
			env:  map[string]string{"PORT": "9000", "DATABASE_URL": "postgres://db"},
			want: Config{Port: "9000", DatabaseURL: "postgres://db"},
		},
		{
			name: "uses the default port when PORT is empty",
			env:  map[string]string{"DATABASE_URL": "postgres://db"},
			want: Config{Port: defaultPort, DatabaseURL: "postgres://db"},
		},
		{
			name:    "names the missing variable",
			env:     map[string]string{"PORT": "9000"},
			wantErr: "DATABASE_URL",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Load(func(key string) string { return tt.env[key] })

			if tt.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Fatalf("Load() error = %v, want it to contain %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("Load() unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("Load() = %+v, want %+v", got, tt.want)
			}
		})
	}
}
