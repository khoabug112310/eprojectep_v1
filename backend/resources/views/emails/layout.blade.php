<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'CineBook')</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #E50914, #B81319);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header .subtitle {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .content h2 {
            color: #333;
            margin-top: 0;
            font-size: 24px;
        }
        .booking-info {
            background-color: #f8f9fa;
            border-left: 4px solid #E50914;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
            flex: 1;
        }
        .info-value {
            color: #212529;
            flex: 2;
            text-align: right;
        }
        .movie-section {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .movie-title {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 10px 0;
        }
        .movie-details {
            opacity: 0.9;
        }
        .seats-section {
            background-color: #e8f5e8;
            border: 1px solid #d4edda;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .seats-title {
            color: #155724;
            font-weight: 600;
            margin: 0 0 10px 0;
        }
        .seat-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .seat-item {
            background-color: #28a745;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 14px;
            font-weight: 500;
        }
        .total-section {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #333;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .total-amount {
            font-size: 24px;
            font-weight: 700;
            margin: 5px 0;
        }
        .qr-section {
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            margin: 20px 0;
        }
        .qr-code {
            max-width: 200px;
            height: auto;
            border: 2px solid #dee2e6;
            border-radius: 8px;
        }
        .instructions {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .instructions h3 {
            color: #856404;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .instructions ul {
            margin: 0;
            padding-left: 20px;
            color: #856404;
        }
        .footer {
            background-color: #212529;
            color: #adb5bd;
            padding: 30px;
            text-align: center;
        }
        .footer a {
            color: #E50914;
            text-decoration: none;
        }
        .footer .social-links {
            margin: 15px 0;
        }
        .footer .social-links a {
            margin: 0 10px;
            color: #adb5bd;
            text-decoration: none;
        }
        
        /* Mobile responsive */
        @media (max-width: 600px) {
            .container {
                margin: 0;
                box-shadow: none;
            }
            .content {
                padding: 20px;
            }
            .header {
                padding: 20px;
            }
            .info-row {
                flex-direction: column;
            }
            .info-value {
                text-align: left;
                margin-top: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 CineBook</h1>
            <p class="subtitle">@yield('subtitle', 'Hệ thống đặt vé xem phim trực tuyến')</p>
        </div>
        
        <div class="content">
            @yield('content')
        </div>
        
        <div class="footer">
            <p><strong>CineBook</strong> - Đặt vé xem phim dễ dàng</p>
            <p>📧 support@cinebook.com | 📞 1900-123-456</p>
            <div class="social-links">
                <a href="#">Facebook</a>
                <a href="#">Instagram</a>
                <a href="#">Twitter</a>
            </div>
            <p style="font-size: 12px; margin-top: 20px;">
                Email này được gửi tự động, vui lòng không trả lời.<br>
                Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận chăm sóc khách hàng.
            </p>
        </div>
    </div>
</body>
</html>