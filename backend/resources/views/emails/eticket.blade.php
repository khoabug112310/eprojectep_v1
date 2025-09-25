@extends('emails.layout')

@section('title', 'Vé điện tử - ' . $booking->booking_code)
@section('subtitle', 'Vé điện tử của bạn')

@section('content')
<h2>Chào {{ $customer->name }},</h2>

<p>Đây là <strong>vé điện tử</strong> cho booking <strong>{{ $booking->booking_code }}</strong> của bạn tại CineBook.</p>

<div class="ticket-container" style="
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border: 2px solid #e50914;
    border-radius: 15px;
    padding: 30px;
    margin: 20px 0;
    color: white;
    position: relative;
    overflow: hidden;
">
    <!-- Movie Title Header -->
    <div style="text-align: center; border-bottom: 2px dashed #e50914; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="color: #e50914; font-size: 28px; margin: 0; font-weight: bold;">
            🎬 {{ $movie->title }}
        </h1>
        <p style="color: #cccccc; margin: 5px 0; font-size: 16px;">
            {{ is_array($movie->genre) ? implode(', ', $movie->genre) : $movie->genre }} | 
            {{ $movie->duration }} phút | 
            {{ $movie->age_rating }}
        </p>
    </div>

    <!-- Ticket Information -->
    <div class="ticket-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div class="left-info">
            <div class="info-item" style="margin-bottom: 15px;">
                <span style="color: #ffd700; font-weight: 600; display: block;">📅 Show Date:</span>
                <span style="font-size: 18px; font-weight: bold;">{{ \Carbon\Carbon::parse($showtime->show_date)->format('d/m/Y') }}</span>
            </div>
            
            <div class="info-item" style="margin-bottom: 15px;">
                <span style="color: #ffd700; font-weight: 600; display: block;">🕐 Show Time:</span>
                <span style="font-size: 18px; font-weight: bold;">{{ \Carbon\Carbon::parse($showtime->show_time)->format('H:i') }}</span>
            </div>

            <div class="info-item" style="margin-bottom: 15px;">
                <span style="color: #ffd700; font-weight: 600; display: block;">🏢 Theater:</span>
                <span style="font-size: 16px;">{{ $theater->name }}</span>
                <span style="color: #cccccc; font-size: 14px; display: block;">{{ $theater->address }}</span>
            </div>
        </div>

        <div class="right-info">
            <div class="info-item" style="margin-bottom: 15px;">
                <span style="color: #ffd700; font-weight: 600; display: block;">🪑 Seats:</span>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                    @foreach($booking->seats as $seat)
                        <span style="
                            background: #e50914; 
                            color: white; 
                            padding: 5px 10px; 
                            border-radius: 5px; 
                            font-weight: bold;
                            font-size: 14px;
                        ">{{ $seat['seat'] }}</span>
                    @endforeach
                </div>
                <span style="color: #cccccc; font-size: 14px; margin-top: 5px; display: block;">
                    {{ count($booking->seats) }} ghế - {{ ucfirst($booking->seats[0]['type']) }}
                </span>
            </div>

            <div class="info-item" style="margin-bottom: 15px;">
                <span style="color: #ffd700; font-weight: 600; display: block;">🎫 Booking Code:</span>
                <span style="font-size: 20px; font-weight: bold; color: #e50914;">{{ $booking->booking_code }}</span>
            </div>

            <div class="info-item">
                <span style="color: #ffd700; font-weight: 600; display: block;">💰 Total Amount:</span>
                <span style="font-size: 18px; font-weight: bold; color: #28a745;">
                    ${{ number_format($booking->total_amount / 25000, 2) }}
                </span>
            </div>
        </div>
    </div>

    <!-- QR Code Section -->
    @if($eTicketData && isset($eTicketData['qr_code']))
    <div style="text-align: center; border-top: 2px dashed #e50914; padding-top: 20px;">
        <h3 style="color: #ffd700; margin-bottom: 15px;">📱 Mã QR Check-in</h3>
        
        @if(isset($eTicketData['qr_code']['qr_code_image_base64']))
        <div style="
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            display: inline-block; 
            margin-bottom: 15px;
        ">
            <img src="data:image/png;base64,{{ $eTicketData['qr_code']['qr_code_image_base64'] }}" 
                 alt="QR Code" 
                 style="width: 150px; height: 150px; display: block;">
        </div>
        @endif
        
        <p style="color: #cccccc; font-size: 14px; margin: 10px 0;">
            Xuất trình mã QR này tại quầy để nhận vé giấy
        </p>
        
        @if(isset($eTicketData['qr_code']['verification_data']['expires_at']))
        <p style="color: #ffc107; font-size: 12px; margin: 5px 0;">
            QR Code có hiệu lực đến: {{ \Carbon\Carbon::parse($eTicketData['qr_code']['verification_data']['expires_at'])->format('d/m/Y H:i') }}
        </p>
        @endif
    </div>
    @endif

    <!-- Decorative Elements -->
    <div style="
        position: absolute; 
        top: -10px; 
        left: -10px; 
        width: 20px; 
        height: 20px; 
        background: #e50914; 
        border-radius: 50%;
    "></div>
    <div style="
        position: absolute; 
        top: -10px; 
        right: -10px; 
        width: 20px; 
        height: 20px; 
        background: #e50914; 
        border-radius: 50%;
    "></div>
    <div style="
        position: absolute; 
        bottom: -10px; 
        left: -10px; 
        width: 20px; 
        height: 20px; 
        background: #e50914; 
        border-radius: 50%;
    "></div>
    <div style="
        position: absolute; 
        bottom: -10px; 
        right: -10px; 
        width: 20px; 
        height: 20px; 
        background: #e50914; 
        border-radius: 50%;
    "></div>
</div>

<!-- Important Instructions -->
<div class="instructions" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
    <h3 style="color: #e50914; margin-bottom: 15px;">📋 Hướng dẫn quan trọng:</h3>
    <ul style="color: #333; line-height: 1.6; margin: 0; padding-left: 20px;">
        <li><strong>Đến rạp sớm:</strong> Vui lòng có mặt trước giờ chiếu <strong>30 phút</strong></li>
        <li><strong>Mang giấy tờ:</strong> Mang theo <strong>CMND/CCCD</strong> và email này</li>
        <li><strong>Check-in:</strong> Xuất trình <strong>mã QR</strong> tại quầy để nhận vé giấy</li>
        <li><strong>Liên hệ hỗ trợ:</strong> Gọi <strong>1900-123-456</strong> nếu cần trợ giúp</li>
        <li><strong>Quy định rạp:</strong> Không mang thức ăn, đồ uống từ bên ngoài</li>
    </ul>
</div>

<!-- Booking Details -->
<div class="booking-details" style="background: #f1f3f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h4 style="color: #333; margin-bottom: 10px;">📄 Chi tiết đặt vé:</h4>
    <div style="color: #666; font-size: 14px; line-height: 1.5;">
        <p><strong>Khách hàng:</strong> {{ $customer->name }}</p>
        <p><strong>Email:</strong> {{ $customer->email }}</p>
        @if($customer->phone)
        <p><strong>Điện thoại:</strong> {{ $customer->phone }}</p>
        @endif
        <p><strong>Booking Date:</strong> {{ $booking->created_at->format('d/m/Y H:i') }}</p>
        @if($booking->payment)
        <p><strong>Payment Method:</strong> {{ ucfirst(str_replace('_', ' ', $booking->payment->payment_method)) }}</p>
        @endif
    </div>
</div>

<!-- Footer Message -->
<div style="text-align: center; margin: 30px 0;">
    <p style="color: #666; font-size: 16px;">
        Chúc bạn có những phút giây giải trí tuyệt vời tại <strong style="color: #e50914;">CineBook</strong>! 🍿🎭
    </p>
    
    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
        <p style="color: #1976d2; font-size: 14px; margin: 0;">
            💡 <strong>Mẹo:</strong> Lưu email này vào ví điện tử để dễ dàng xuất trình tại rạp
        </p>
    </div>
</div>

<p style="margin-top: 30px; text-align: center;">
    Trân trọng,<br>
    <strong style="color: #e50914;">Đội ngũ CineBook</strong>
</p>
@endsection