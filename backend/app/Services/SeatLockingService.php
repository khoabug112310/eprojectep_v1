<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Exception;
use Predis\Connection\ConnectionException;
use Redis\RedisException;

class SeatLockingService
{
    private const LOCK_TTL = 900; // 15 minutes in seconds
    private const LOCK_KEY_PREFIX = 'seat_lock';
    private const STATUS_KEY_PREFIX = 'seat_status';
    private const CONNECTION_RETRY_ATTEMPTS = 3;
    private const CONNECTION_RETRY_DELAY = 100; // milliseconds
    private const FALLBACK_CACHE_TTL = 300; // 5 minutes for fallback cache
    
    /**
     * Lock multiple seats for a user atomically with failover support
     *
     * @param array $seats Array of seat codes ['A1', 'A2', 'B1']
     * @param int $showtimeId
     * @param int $userId
     * @return array Result with success status and details
     */
    public function lockSeats(array $seats, int $showtimeId, int $userId): array
    {
        $attempts = 0;
        $lastError = null;
        
        while ($attempts < self::CONNECTION_RETRY_ATTEMPTS) {
            try {
                return $this->performSeatLocking($seats, $showtimeId, $userId);
            } catch (ConnectionException | RedisException $e) {
                $attempts++;
                $lastError = $e;
                
                Log::warning('Redis connection failed during seat locking', [
                    'attempt' => $attempts,
                    'error' => $e->getMessage(),
                    'user_id' => $userId,
                    'showtime_id' => $showtimeId,
                    'seats' => $seats
                ]);
                
                if ($attempts < self::CONNECTION_RETRY_ATTEMPTS) {
                    usleep(self::CONNECTION_RETRY_DELAY * 1000 * $attempts); // Exponential backoff
                }
            } catch (Exception $e) {
                // Non-connection related errors should not be retried
                return $this->handleSeatLockingError($e, $seats, $showtimeId, $userId);
            }
        }
        
        // All retry attempts failed - use fallback strategy
        return $this->fallbackSeatLocking($seats, $showtimeId, $userId, $lastError);
    }
    
    /**
     * Unlock seats for a specific user
     *
     * @param array $seats
     * @param int $showtimeId
     * @param int $userId
     * @return bool
     */
    public function unlockSeats(array $seats, int $showtimeId, int $userId): bool
    {
        try {
            $redis = Redis::connection();
            $unlocked = 0;
            
            foreach ($seats as $seat) {
                $lockKey = $this->getLockKey($showtimeId, $seat);
                $existingLock = $redis->get($lockKey);
                
                if ($existingLock) {
                    $lockInfo = json_decode($existingLock, true);
                    
                    // Only unlock if it belongs to the same user
                    if ($lockInfo['user_id'] === $userId) {
                        $redis->del($lockKey);
                        $unlocked++;
                    }
                }
            }
            
            Log::info('Seats unlocked', [
                'user_id' => $userId,
                'showtime_id' => $showtimeId,
                'requested_seats' => count($seats),
                'unlocked_seats' => $unlocked
            ]);
            
            return $unlocked > 0;
            
        } catch (Exception $e) {
            Log::error('Seat unlocking failed', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
                'showtime_id' => $showtimeId,
                'seats' => $seats
            ]);
            
            return false;
        }
    }
    
    /**
     * Extend lock duration for user's seats
     *
     * @param array $seats
     * @param int $showtimeId
     * @param int $userId
     * @return array
     */
    public function extendLock(array $seats, int $showtimeId, int $userId): array
    {
        try {
            $redis = Redis::connection();
            $extended = [];
            $failed = [];
            
            foreach ($seats as $seat) {
                $lockKey = $this->getLockKey($showtimeId, $seat);
                $existingLock = $redis->get($lockKey);
                
                if ($existingLock) {
                    $lockInfo = json_decode($existingLock, true);
                    
                    if ($lockInfo['user_id'] === $userId) {
                        // Update lock data with new expiration
                        $lockInfo['expires_at'] = Carbon::now()->addSeconds(self::LOCK_TTL)->toISOString();
                        $redis->setex($lockKey, self::LOCK_TTL, json_encode($lockInfo));
                        $extended[] = $seat;
                    } else {
                        $failed[] = $seat;
                    }
                } else {
                    $failed[] = $seat;
                }
            }
            
            return [
                'success' => count($extended) > 0,
                'extended_seats' => $extended,
                'failed_seats' => $failed,
                'new_expiry' => Carbon::now()->addSeconds(self::LOCK_TTL)->toISOString()
            ];
            
        } catch (Exception $e) {
            Log::error('Lock extension failed', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
                'showtime_id' => $showtimeId,
                'seats' => $seats
            ]);
            
            return [
                'success' => false,
                'extended_seats' => [],
                'failed_seats' => $seats,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get comprehensive seat status for a showtime
     *
     * @param int $showtimeId
     * @return array
     */
    public function getSeatStatus(int $showtimeId): array
    {
        try {
            $redis = Redis::connection();
            $pattern = $this->getLockKey($showtimeId, '*');
            $lockKeys = $redis->keys($pattern);
            
            $seatStatus = [
                'available' => [],
                'locked' => [],
                'occupied' => []
            ];
            
            // Get all locked seats
            foreach ($lockKeys as $lockKey) {
                $seatCode = $this->extractSeatFromKey($lockKey);
                $lockData = $redis->get($lockKey);
                
                if ($lockData) {
                    $lockInfo = json_decode($lockData, true);
                    $seatStatus['locked'][] = [
                        'seat' => $seatCode,
                        'user_id' => $lockInfo['user_id'],
                        'locked_at' => $lockInfo['locked_at'],
                        'expires_at' => $lockInfo['expires_at']
                    ];
                }
            }
            
            // TODO: Get occupied seats from database (from confirmed bookings)
            // This would require integration with the Showtime model
            
            return [
                'success' => true,
                'showtime_id' => $showtimeId,
                'seat_status' => $seatStatus,
                'last_updated' => Carbon::now()->toISOString()
            ];
            
        } catch (Exception $e) {
            Log::error('Failed to get seat status', [
                'error' => $e->getMessage(),
                'showtime_id' => $showtimeId
            ]);
            
            return [
                'success' => false,
                'message' => 'Unable to retrieve seat status',
                'error' => config('app.debug') ? $e->getMessage() : null
            ];
        }
    }
    
    /**
     * Clean up expired locks (called by background job)
     *
     * @return array Cleanup statistics
     */
    public function cleanupExpiredLocks(): array
    {
        try {
            $redis = Redis::connection();
            $pattern = self::LOCK_KEY_PREFIX . ':*';
            $allLockKeys = $redis->keys($pattern);
            
            $cleaned = 0;
            $errors = 0;
            
            foreach ($allLockKeys as $lockKey) {
                try {
                    $lockData = $redis->get($lockKey);
                    if (!$lockData) {
                        // Key already expired naturally
                        continue;
                    }
                    
                    $lockInfo = json_decode($lockData, true);
                    $expiresAt = Carbon::parse($lockInfo['expires_at']);
                    
                    if ($expiresAt->isPast()) {
                        $redis->del($lockKey);
                        $cleaned++;
                    }
                } catch (Exception $e) {
                    $errors++;
                    Log::warning('Error cleaning up lock', [
                        'lock_key' => $lockKey,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            Log::info('Lock cleanup completed', [
                'total_keys_checked' => count($allLockKeys),
                'cleaned_locks' => $cleaned,
                'errors' => $errors
            ]);
            
            return [
                'success' => true,
                'total_checked' => count($allLockKeys),
                'cleaned' => $cleaned,
                'errors' => $errors
            ];
            
        } catch (Exception $e) {
            Log::error('Lock cleanup failed', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Test Redis connectivity with comprehensive diagnostics
     *
     * @return array
     */
    public function testConnection(): array
    {
        $diagnostics = [
            'connection_attempts' => [],
            'redis_status' => 'unknown',
            'fallback_available' => false,
            'timestamp' => Carbon::now()->toISOString()
        ];
        
        // Test Redis connection
        try {
            $redis = $this->getRedisConnection();
            $testKey = 'connection_test_' . time() . '_' . rand(1000, 9999);
            
            // Test basic operations
            $startTime = microtime(true);
            $redis->set($testKey, 'test_value', 'EX', 10);
            $value = $redis->get($testKey);
            $redis->del($testKey);
            $endTime = microtime(true);
            
            $responseTime = round(($endTime - $startTime) * 1000, 2);
            
            if ($value === 'test_value') {
                $diagnostics['redis_status'] = 'connected';
                $diagnostics['response_time_ms'] = $responseTime;
                
                // Get additional Redis info
                try {
                    $info = $redis->info();
                    $diagnostics['redis_info'] = [
                        'version' => $info['redis_version'] ?? 'unknown',
                        'connected_clients' => $info['connected_clients'] ?? 0,
                        'used_memory_human' => $info['used_memory_human'] ?? 'unknown',
                        'uptime_in_seconds' => $info['uptime_in_seconds'] ?? 0
                    ];
                } catch (Exception $e) {
                    $diagnostics['redis_info_error'] = $e->getMessage();
                }
                
                return [
                    'success' => true,
                    'message' => 'Redis connection is working properly',
                    'diagnostics' => $diagnostics
                ];
            } else {
                $diagnostics['redis_status'] = 'operation_failed';
                return [
                    'success' => false,
                    'message' => 'Redis operations failed - read/write test failed',
                    'diagnostics' => $diagnostics
                ];
            }
            
        } catch (ConnectionException | RedisException $e) {
            $diagnostics['redis_status'] = 'connection_failed';
            $diagnostics['redis_error'] = $e->getMessage();
            
            // Test fallback cache
            $fallbackTest = $this->testFallbackCache();
            $diagnostics['fallback_available'] = $fallbackTest['success'];
            $diagnostics['fallback_test'] = $fallbackTest;
            
            return [
                'success' => false,
                'message' => 'Redis connection failed: ' . $e->getMessage(),
                'diagnostics' => $diagnostics,
                'fallback_available' => $fallbackTest['success']
            ];
        } catch (Exception $e) {
            $diagnostics['redis_status'] = 'error';
            $diagnostics['error'] = $e->getMessage();
            
            return [
                'success' => false,
                'message' => 'Redis test failed: ' . $e->getMessage(),
                'diagnostics' => $diagnostics
            ];
        }
    }
    
    /**
     * Test fallback cache availability
     */
    private function testFallbackCache(): array
    {
        try {
            $testKey = 'fallback_test_' . time();
            $testValue = 'fallback_value_' . rand(1000, 9999);
            
            Cache::put($testKey, $testValue, 60);
            $retrievedValue = Cache::get($testKey);
            Cache::forget($testKey);
            
            if ($retrievedValue === $testValue) {
                return [
                    'success' => true,
                    'message' => 'Fallback cache is working',
                    'cache_driver' => config('cache.default')
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Fallback cache read/write test failed'
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Fallback cache test failed: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Generate Redis key for seat lock
     *
     * @param int $showtimeId
     * @param string $seatCode
     * @return string
     */
    private function getLockKey(int $showtimeId, string $seatCode): string
    {
        return self::LOCK_KEY_PREFIX . ':' . $showtimeId . ':' . $seatCode;
    }
    
    /**
     * Generate fallback cache key for seat lock
     *
     * @param int $showtimeId
     * @param string $seatCode
     * @return string
     */
    private function getFallbackCacheKey(int $showtimeId, string $seatCode): string
    {
        return 'fallback_' . self::LOCK_KEY_PREFIX . ':' . $showtimeId . ':' . $seatCode;
    }
    
    /**
     * Extract seat code from Redis key
     *
     * @param string $lockKey
     * @return string
     */
    private function extractSeatFromKey(string $lockKey): string
    {
        $parts = explode(':', $lockKey);
        return end($parts);
    }
    
    /**
     * Get lock statistics for monitoring with failover support
     *
     * @return array
     */
    public function getLockStatistics(): array
    {
        try {
            return $this->getRedisLockStatistics();
        } catch (ConnectionException | RedisException $e) {
            Log::warning('Redis connection failed during statistics retrieval, using fallback', [
                'error' => $e->getMessage()
            ]);
            
            return $this->getFallbackLockStatistics();
        } catch (Exception $e) {
            Log::error('Failed to get lock statistics', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Perform actual seat locking operation
     */
    private function performSeatLocking(array $seats, int $showtimeId, int $userId): array
    {
        $lockData = [
            'user_id' => $userId,
            'locked_at' => Carbon::now()->toISOString(),
            'showtime_id' => $showtimeId,
            'expires_at' => Carbon::now()->addSeconds(self::LOCK_TTL)->toISOString()
        ];

        $redis = $this->getRedisConnection();
        
        $lockKeys = [];
        $conflictSeats = [];
        
        // First, check if any seats are already locked
        foreach ($seats as $seat) {
            $lockKey = $this->getLockKey($showtimeId, $seat);
            $existingLock = $redis->get($lockKey);
            
            if ($existingLock) {
                $lockInfo = json_decode($existingLock, true);
                // Allow same user to extend their lock
                if ($lockInfo['user_id'] !== $userId) {
                    $conflictSeats[] = $seat;
                }
            }
            $lockKeys[] = $lockKey;
        }
        
        // If there are conflicts, return error
        if (!empty($conflictSeats)) {
            return [
                'success' => false,
                'message' => 'Some seats are already locked by other users',
                'data' => [
                    'conflicts' => $conflictSeats
                ]
            ];
        }
        
        // Lock all seats atomically
        $redis->multi();
        $lockedSeats = [];
        
        foreach ($seats as $index => $seat) {
            $lockKey = $lockKeys[$index];
            $redis->setex($lockKey, self::LOCK_TTL, json_encode($lockData));
            $lockedSeats[] = $seat;
        }
        
        $results = $redis->exec();
        
        // Check if all operations succeeded
        $allSucceeded = true;
        if (is_array($results)) {
            foreach ($results as $result) {
                if (!$result) {
                    $allSucceeded = false;
                    break;
                }
            }
        } else {
            $allSucceeded = false;
        }
        
        if ($allSucceeded) {
            Log::info('Seats locked successfully', [
                'user_id' => $userId,
                'showtime_id' => $showtimeId,
                'seats' => $seats,
                'lock_duration' => self::LOCK_TTL
            ]);
            
            return [
                'success' => true,
                'locked_seats' => $lockedSeats,
                'expires_at' => Carbon::now()->addSeconds(self::LOCK_TTL)->toISOString()
            ];
        } else {
            // Rollback - unlock any seats that might have been locked
            $this->unlockSeats($seats, $showtimeId, $userId);
            
            return [
                'success' => false,
                'message' => 'Failed to lock seats atomically'
            ];
        }
    }
    
    /**
     * Handle seat locking errors
     */
    private function handleSeatLockingError(Exception $e, array $seats, int $showtimeId, int $userId): array
    {
        Log::error('Seat locking failed', [
            'error' => $e->getMessage(),
            'user_id' => $userId,
            'showtime_id' => $showtimeId,
            'seats' => $seats,
            'trace' => $e->getTraceAsString()
        ]);
        
        return [
            'success' => false,
            'message' => 'Seat locking service temporarily unavailable',
            'error' => config('app.debug') ? $e->getMessage() : null
        ];
    }
    
    /**
     * Fallback seat locking using Laravel cache
     */
    private function fallbackSeatLocking(array $seats, int $showtimeId, int $userId, Exception $lastError): array
    {
        Log::warning('Using fallback cache for seat locking', [
            'user_id' => $userId,
            'showtime_id' => $showtimeId,
            'seats' => $seats,
            'last_error' => $lastError->getMessage()
        ]);
        
        try {
            $conflictSeats = [];
            $lockedSeats = [];
            
            // Check for conflicts using fallback cache
            foreach ($seats as $seat) {
                $fallbackKey = $this->getFallbackCacheKey($showtimeId, $seat);
                $existingLock = Cache::get($fallbackKey);
                
                if ($existingLock && $existingLock['user_id'] !== $userId) {
                    $conflictSeats[] = $seat;
                }
            }
            
            if (!empty($conflictSeats)) {
                return [
                    'success' => false,
                    'message' => 'Some seats are already locked by other users (fallback mode)',
                    'data' => [
                        'conflicts' => $conflictSeats,
                        'fallback_mode' => true
                    ]
                ];
            }
            
            // Lock seats using fallback cache
            $lockData = [
                'user_id' => $userId,
                'locked_at' => Carbon::now()->toISOString(),
                'showtime_id' => $showtimeId,
                'expires_at' => Carbon::now()->addSeconds(self::FALLBACK_CACHE_TTL)->toISOString(),
                'fallback_mode' => true
            ];
            
            foreach ($seats as $seat) {
                $fallbackKey = $this->getFallbackCacheKey($showtimeId, $seat);
                Cache::put($fallbackKey, $lockData, self::FALLBACK_CACHE_TTL);
                $lockedSeats[] = $seat;
            }
            
            return [
                'success' => true,
                'locked_seats' => $lockedSeats,
                'expires_at' => $lockData['expires_at'],
                'fallback_mode' => true,
                'warning' => 'Redis unavailable - using fallback cache with reduced TTL'
            ];
            
        } catch (Exception $e) {
            Log::error('Fallback seat locking also failed', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
                'showtime_id' => $showtimeId,
                'seats' => $seats
            ]);
            
            return [
                'success' => false,
                'message' => 'Both Redis and fallback cache are unavailable',
                'error' => config('app.debug') ? $e->getMessage() : null
            ];
        }
    }
    
    /**
     * Get Redis connection with error handling
     */
    private function getRedisConnection()
    {
        try {
            $redis = Redis::connection();
            // Test the connection
            $redis->ping();
            return $redis;
        } catch (ConnectionException | RedisException $e) {
            Log::warning('Redis connection test failed', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
    
    /**
     * Get Redis lock statistics
     */
    private function getRedisLockStatistics(): array
    {
        $redis = $this->getRedisConnection();
        $pattern = self::LOCK_KEY_PREFIX . ':*';
        $allLockKeys = $redis->keys($pattern);
        
        $stats = [
            'total_locks' => count($allLockKeys),
            'locks_by_showtime' => [],
            'locks_by_user' => [],
            'source' => 'redis'
        ];
        
        foreach ($allLockKeys as $lockKey) {
            $lockData = $redis->get($lockKey);
            if ($lockData) {
                $lockInfo = json_decode($lockData, true);
                $showtimeId = $lockInfo['showtime_id'];
                $userId = $lockInfo['user_id'];
                
                $stats['locks_by_showtime'][$showtimeId] = 
                    ($stats['locks_by_showtime'][$showtimeId] ?? 0) + 1;
                $stats['locks_by_user'][$userId] = 
                    ($stats['locks_by_user'][$userId] ?? 0) + 1;
            }
        }
        
        return [
            'success' => true,
            'statistics' => $stats,
            'generated_at' => Carbon::now()->toISOString()
        ];
    }
    
    /**
     * Get fallback lock statistics
     */
    private function getFallbackLockStatistics(): array
    {
        // This is a simplified version using cache tags if available
        // In a full implementation, you might store fallback statistics separately
        
        return [
            'success' => true,
            'statistics' => [
                'total_locks' => 0,
                'locks_by_showtime' => [],
                'locks_by_user' => [],
                'source' => 'fallback_cache',
                'note' => 'Limited statistics available in fallback mode'
            ],
            'generated_at' => Carbon::now()->toISOString()
        ];
    }