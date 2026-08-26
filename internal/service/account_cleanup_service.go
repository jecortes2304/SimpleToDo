package service

import (
	"context"
	"log"
	"time"
)

const UnverifiedAccountTTL = 7 * 24 * time.Hour

func (s *AuthService) CleanupExpiredUnverifiedUsers(now time.Time) (int64, error) {
	return s.AuthRepository.DeleteExpiredUnverifiedUsers(now.Add(-UnverifiedAccountTTL))
}

func (s *AuthService) RunUnverifiedAccountCleanup(ctx context.Context, interval time.Duration) {
	run := func() {
		deleted, err := s.CleanupExpiredUnverifiedUsers(time.Now())
		if err != nil {
			log.Printf("unverified account cleanup failed: %v", err)
			return
		}
		if deleted > 0 {
			log.Printf("deleted %d expired unverified account(s)", deleted)
		}
	}

	run()
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			run()
		}
	}
}
