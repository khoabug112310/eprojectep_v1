<?php

namespace App\Listeners;

use App\Services\ApiResponseCachingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class CacheInvalidationListener implements ShouldQueue
{
    use InteractsWithQueue;

    protected $cachingService;

    public function __construct(ApiResponseCachingService $cachingService)
    {
        $this->cachingService = $cachingService;
    }

    /**
     * Handle movie events
     */
    public function handleMovieEvent($event): void
    {
        $eventName = $this->getEventName($event);
        $context = $this->getEventContext($event);
        
        Log::info('Movie event triggered cache invalidation', [
            'event' => $eventName,
            'context' => $context
        ]);
        
        $this->cachingService->invalidateByEvent($eventName, $context);
    }

    /**
     * Handle theater events
     */
    public function handleTheaterEvent($event): void
    {
        $eventName = $this->getEventName($event);
        $context = $this->getEventContext($event);
        
        Log::info('Theater event triggered cache invalidation', [
            'event' => $eventName,
            'context' => $context
        ]);
        
        $this->cachingService->invalidateByEvent($eventName, $context);
    }

    /**
     * Handle showtime events
     */
    public function handleShowtimeEvent($event): void
    {
        $eventName = $this->getEventName($event);
        $context = $this->getEventContext($event);
        
        Log::info('Showtime event triggered cache invalidation', [
            'event' => $eventName,
            'context' => $context
        ]);
        
        $this->cachingService->invalidateByEvent($eventName, $context);
    }

    /**
     * Handle booking events
     */
    public function handleBookingEvent($event): void
    {
        $eventName = $this->getEventName($event);
        $context = $this->getEventContext($event);
        
        Log::info('Booking event triggered cache invalidation', [
            'event' => $eventName,
            'context' => $context
        ]);
        
        $this->cachingService->invalidateByEvent($eventName, $context);
    }

    /**
     * Handle user events
     */
    public function handleUserEvent($event): void
    {
        $eventName = $this->getEventName($event);
        $context = $this->getEventContext($event);
        
        Log::info('User event triggered cache invalidation', [
            'event' => $eventName,
            'context' => $context
        ]);
        
        $this->cachingService->invalidateByEvent($eventName, $context);
    }

    /**
     * Handle payment events
     */
    public function handlePaymentEvent($event): void
    {
        $eventName = $this->getEventName($event);
        $context = $this->getEventContext($event);
        
        Log::info('Payment event triggered cache invalidation', [
            'event' => $eventName,
            'context' => $context
        ]);
        
        $this->cachingService->invalidateByEvent($eventName, $context);
    }

    /**
     * Handle seat locking events
     */
    public function handleSeatLockingEvent($event): void
    {
        $eventName = 'seats_locked';
        $context = $this->getEventContext($event);
        
        Log::info('Seat locking event triggered cache invalidation', [
            'event' => $eventName,
            'context' => $context
        ]);
        
        $this->cachingService->invalidateByEvent($eventName, $context);
    }

    /**
     * Get event name from event class
     */
    private function getEventName($event): string
    {
        $className = class_basename($event);
        
        // Convert PascalCase to snake_case
        $eventName = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $className));
        
        // Map specific event patterns
        $eventMappings = [
            'movie_created' => 'movie_created',
            'movie_updated' => 'movie_updated',
            'movie_deleted' => 'movie_deleted',
            'theater_created' => 'theater_created',
            'theater_updated' => 'theater_updated',
            'theater_deleted' => 'theater_deleted',
            'showtime_created' => 'showtime_updated',
            'showtime_updated' => 'showtime_updated',
            'showtime_deleted' => 'showtime_updated',
            'booking_created' => 'booking_created',
            'booking_updated' => 'booking_updated',
            'user_updated' => 'user_updated',
            'payment_processed' => 'payment_processed',
            'seats_locked' => 'seats_locked',
        ];
        
        return $eventMappings[$eventName] ?? $eventName;
    }

    /**
     * Get context data from event
     */
    private function getEventContext($event): array
    {
        $context = [];
        
        // Extract relevant data from event
        if (isset($event->movie)) {
            $context['movie_id'] = $event->movie->id ?? null;
        }
        
        if (isset($event->theater)) {
            $context['theater_id'] = $event->theater->id ?? null;
        }
        
        if (isset($event->showtime)) {
            $context['showtime_id'] = $event->showtime->id ?? null;
            $context['movie_id'] = $event->showtime->movie_id ?? null;
            $context['theater_id'] = $event->showtime->theater_id ?? null;
        }
        
        if (isset($event->booking)) {
            $context['booking_id'] = $event->booking->id ?? null;
            $context['user_id'] = $event->booking->user_id ?? null;
            $context['showtime_id'] = $event->booking->showtime_id ?? null;
        }
        
        if (isset($event->user)) {
            $context['user_id'] = $event->user->id ?? null;
        }
        
        if (isset($event->payment)) {
            $context['payment_id'] = $event->payment->id ?? null;
            $context['booking_id'] = $event->payment->booking_id ?? null;
        }
        
        // Add timestamp
        $context['timestamp'] = now()->toISOString();
        
        return $context;
    }

    /**
     * Handle failed jobs
     */
    public function failed($event, $exception): void
    {
        Log::error('Cache invalidation listener failed', [
            'event' => class_basename($event),
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);
    }
}