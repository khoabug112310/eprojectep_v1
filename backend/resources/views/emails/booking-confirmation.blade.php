@extends('emails.layout')

@section('title', 'Booking Confirmation - ' . $booking->booking_code)
@section('subtitle', 'Booking confirmed successfully')

@section('content')
<h2>Hello {{ $customer->name }},</h2>

<p>Thank you for booking with <strong>CineBook</strong>! Your booking has been confirmed successfully.</p>

<div class="booking-info">
    <div class="info-row">
        <span class="info-label">Booking Code:</span>
        <span class="info-value"><strong>{{ $booking->booking_code }}</strong></span>
    </div>
    <div class="info-row">
        <span class="info-label">Booking Date:</span>
        <span class="info-value">{{ $booking->created_at->format('d/m/Y H:i') }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value">
            @if($booking->booking_status === 'confirmed')
                <span style="color: #28a745; font-weight: 600;">✅ Confirmed</span>
            @else
                <span style="color: #ffc107; font-weight: 600;">⏳ {{ ucfirst($booking->booking_status) }}</span>
            @endif
        </span>
    </div>
    <div class="info-row">
        <span class="info-label">Payment:</span>
        <span class="info-value">
            @if($booking->payment_status === 'completed')
                <span style="color: #28a745; font-weight: 600;">💳 Paid</span>
            @else
                <span style="color: #dc3545; font-weight: 600;">❌ {{ ucfirst($booking->payment_status) }}</span>
            @endif
        </span>
    </div>
</div>

<div class="movie-section">
    <div class="movie-title">🎬 {{ $movie->title }}</div>
    <div class="movie-details">
        <div>🎭 Genre: {{ is_array($movie->genre) ? implode(', ', $movie->genre) : $movie->genre }}</div>
        <div>⏰ Duration: {{ $movie->duration }} minutes</div>
        <div>🔞 Age Rating: {{ $movie->age_rating }}</div>
        <div>🌐 Language: {{ $movie->language }}</div>
    </div>
</div>

<div class="booking-info">
    <div class="info-row">
        <span class="info-label">🏢 Theater:</span>
        <span class="info-value">{{ $theater->name }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">📍 Address:</span>
        <span class="info-value">{{ $theater->address }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">📅 Show Date:</span>
        <span class="info-value">{{ \Carbon\Carbon::parse($showtime->show_date)->format('d/m/Y') }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">🕐 Show Time:</span>
        <span class="info-value">{{ \Carbon\Carbon::parse($showtime->show_time)->format('H:i') }}</span>
    </div>
</div>

<div class="seats-section">
    <div class="seats-title">🪑 Booked Seats ({{ count($booking->seats) }} seats):</div>
    <div class="seat-list">
        @foreach($booking->seats as $seat)
            <span class="seat-item">{{ $seat['seat'] }} ({{ ucfirst($seat['type']) }})</span>
        @endforeach
    </div>
</div>

<div class="total-section">
    <div>💰 Total Payment</div>
    <div class="total-amount">${{ number_format($booking->total_amount / 25000, 2) }}</div>
    @if($payment)
        <div style="font-size: 14px; margin-top: 10px;">
            Payment Method: {{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}
        </div>
    @endif
</div>

@if($eTicketData && isset($eTicketData['qr_code']))
<div class="qr-section">
    <h3>📱 Mã QR vé điện tử</h3>
    <p>Vui lòng xuất trình mã QR này tại rạp để vào xem phim:</p>
    @if(isset($eTicketData['qr_code']['qr_code_image_base64']))
        <img src="data:image/png;base64,{{ $eTicketData['qr_code']['qr_code_image_base64'] }}" 
             alt="QR Code" class="qr-code">
    @endif
    <p style="font-size: 12px; color: #6c757d; margin-top: 10px;">
        Mã QR cũng được đính kèm trong email này
    </p>
</div>
@endif

<div class="instructions">
    <h3>📋 Hướng dẫn quan trọng:</h3>
    <ul>
        <li>Vui lòng có mặt tại rạp trước giờ chiếu <strong>30 phút</strong></li>
        <li>Mang theo <strong>giấy tờ tùy thân</strong> và email xác nhận này</li>
        <li>Xuất trình <strong>mã QR</strong> hoặc <strong>mã đặt vé</strong> tại quầy</li>
        <li>Không được mang thức ăn, đồ uống từ bên ngoài vào rạp</li>
        <li>Liên hệ hotline <strong>1900-123-456</strong> nếu cần hỗ trợ</li>
    </ul>
</div>

<p>Chúc bạn có những phút giây giải trí tuyệt vời tại CineBook! 🍿🎭</p>

<p style="margin-top: 30px;">
    Trân trọng,<br>
    <strong>Đội ngũ CineBook</strong>
</p>
@endsection