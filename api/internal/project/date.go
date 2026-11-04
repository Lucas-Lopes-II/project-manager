package project

import (
	"encoding/json"
	"fmt"
	"time"
)

// Date is a calendar day, with no time or time zone.
type Date struct {
	time time.Time
}

// ParseDate reads a date in the YYYY-MM-DD format.
func ParseDate(value string) (Date, error) {
	parsed, err := time.Parse(time.DateOnly, value)
	if err != nil {
		return Date{}, fmt.Errorf("parse date: %w", err)
	}
	return Date{time: parsed}, nil
}

// After reports whether d comes after other.
func (d Date) After(other Date) bool {
	return d.time.After(other.time)
}

// String returns the date in the YYYY-MM-DD format.
func (d Date) String() string {
	return d.time.Format(time.DateOnly)
}

// MarshalJSON writes the date in the YYYY-MM-DD format.
func (d Date) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.String())
}
