<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Theater;

class TheaterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $theaters = [
            // CGV CINEMAS
            [
                'name' => 'CGV Vincom Center Landmark 81',
                'address' => 'Tầng 5, Vincom Center Landmark 81, 720A Điện Biên Phủ, Vinhomes Tân Cảng, Bình Thạnh',
                'city' => 'TP.HCM',
                'total_seats' => 280,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 10, 'cols' => 14, 'price' => 100000],
                    'platinum' => ['rows' => 4, 'cols' => 12, 'price' => 130000],
                    'box' => ['rows' => 2, 'cols' => 6, 'price' => 180000],
                ]),
                'facilities' => json_encode(['IMAX', '4DX', 'ScreenX', 'Dolby Atmos', 'Recliner Seats']),
                'status' => 'active',
            ],
            [
                'name' => 'CGV Aeon Mall Tân Phú',
                'address' => 'Tầng 3, Aeon Mall Tân Phú, 30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú',
                'city' => 'TP.HCM',
                'total_seats' => 250,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 8, 'cols' => 12, 'price' => 95000],
                    'platinum' => ['rows' => 4, 'cols' => 10, 'price' => 120000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 160000],
                ]),
                'facilities' => json_encode(['3D', 'Dolby Atmos', 'Recliner Seats']),
                'status' => 'active',
            ],
            [
                'name' => 'CGV Saigon Center',
                'address' => 'Tầng 4, Saigon Center, 65 Lê Lợi, Bến Nghé, Quận 1',
                'city' => 'TP.HCM',
                'total_seats' => 220,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 7, 'cols' => 12, 'price' => 110000],
                    'platinum' => ['rows' => 4, 'cols' => 10, 'price' => 140000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 190000],
                ]),
                'facilities' => json_encode(['3D', 'Dolby Atmos', 'VIP Lounge']),
                'status' => 'active',
            ],

            // GALAXY CINEMA
            [
                'name' => 'Galaxy Nguyễn Du',
                'address' => '116 Nguyễn Du, Bến Thành, Quận 1',
                'city' => 'TP.HCM',
                'total_seats' => 300,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 12, 'cols' => 15, 'price' => 85000],
                    'platinum' => ['rows' => 5, 'cols' => 12, 'price' => 115000],
                    'box' => ['rows' => 2, 'cols' => 6, 'price' => 150000],
                ]),
                'facilities' => json_encode(['2D', '3D', 'Dolby 7.1', 'Galaxy Sofa']),
                'status' => 'active',
            ],
            [
                'name' => 'Galaxy Kinh Dương Vương',
                'address' => '718bis Kinh Dương Vương, An Lạc, Bình Tân',
                'city' => 'TP.HCM',
                'total_seats' => 260,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 9, 'cols' => 12, 'price' => 80000],
                    'platinum' => ['rows' => 4, 'cols' => 10, 'price' => 110000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 140000],
                ]),
                'facilities' => json_encode(['2D', '3D', 'Dolby Atmos']),
                'status' => 'active',
            ],
            [
                'name' => 'Galaxy Tân Bình',
                'address' => '246 Nguyễn Hồng Đào, Phường 14, Tân Bình',
                'city' => 'TP.HCM',
                'total_seats' => 240,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 8, 'cols' => 12, 'price' => 85000],
                    'platinum' => ['rows' => 4, 'cols' => 10, 'price' => 115000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 145000],
                ]),
                'facilities' => json_encode(['2D', '3D', 'Sound DTS']),
                'status' => 'active',
            ],

            // LOTTE CINEMA
            [
                'name' => 'Lotte Cinema Diamond Plaza',
                'address' => 'Tầng 13, Diamond Plaza, 34 Lê Duẩn, Bến Nghé, Quận 1',
                'city' => 'TP.HCM',
                'total_seats' => 320,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 12, 'cols' => 16, 'price' => 105000],
                    'platinum' => ['rows' => 5, 'cols' => 12, 'price' => 135000],
                    'box' => ['rows' => 2, 'cols' => 8, 'price' => 175000],
                ]),
                'facilities' => json_encode(['4DX', 'IMAX', 'Dolby Atmos', 'Super Plex G']),
                'status' => 'active',
            ],
            [
                'name' => 'Lotte Cinema Cộng Hòa',
                'address' => 'Tầng 4, Lotte Mart, 469 Nguyễn Hữu Thọ, Tân Hưng, Quận 7',
                'city' => 'TP.HCM',
                'total_seats' => 200,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 7, 'cols' => 12, 'price' => 90000],
                    'platinum' => ['rows' => 3, 'cols' => 10, 'price' => 120000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 155000],
                ]),
                'facilities' => json_encode(['2D', '3D', 'Dolby Digital']),
                'status' => 'active',
            ],

            // BHD STAR CINEPLEX
            [
                'name' => 'BHD Star Bitexco',
                'address' => 'Tầng 5, Bitexco Financial Tower, 2 Hải Triều, Bến Nghé, Quận 1',
                'city' => 'TP.HCM',
                'total_seats' => 180,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 6, 'cols' => 12, 'price' => 120000],
                    'platinum' => ['rows' => 3, 'cols' => 8, 'price' => 150000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 200000],
                ]),
                'facilities' => json_encode(['IMAX', 'Dolby Atmos', 'Premium Lounge']),
                'status' => 'active',
            ],
            [
                'name' => 'BHD Star Phạm Hùng',
                'address' => 'Tầng 6, BigC Garden, 190 Phạm Hùng, Mỹ Đình, Nam Từ Liêm',
                'city' => 'Hà Nội',
                'total_seats' => 220,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 8, 'cols' => 12, 'price' => 95000],
                    'platinum' => ['rows' => 4, 'cols' => 10, 'price' => 125000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 165000],
                ]),
                'facilities' => json_encode(['3D', 'Dolby Atmos', 'Luxury Seats']),
                'status' => 'active',
            ],

            // HÀ NỘI CINEMAS
            [
                'name' => 'CGV Vincom Bà Triệu',
                'address' => 'Tầng 5-6, Vincom Center Bà Triệu, 191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng',
                'city' => 'Hà Nội',
                'total_seats' => 270,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 10, 'cols' => 14, 'price' => 90000],
                    'platinum' => ['rows' => 4, 'cols' => 12, 'price' => 120000],
                    'box' => ['rows' => 2, 'cols' => 6, 'price' => 160000],
                ]),
                'facilities' => json_encode(['IMAX', '4DX', 'Dolby Atmos']),
                'status' => 'active',
            ],
            [
                'name' => 'Galaxy Mipec Long Biên',
                'address' => 'Tầng 4, Mipec Long Biên, 2 Cổ Linh, Long Biên',
                'city' => 'Hà Nội',
                'total_seats' => 230,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 8, 'cols' => 12, 'price' => 85000],
                    'platinum' => ['rows' => 4, 'cols' => 10, 'price' => 115000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 145000],
                ]),
                'facilities' => json_encode(['2D', '3D', 'Dolby 7.1']),
                'status' => 'active',
            ],
            [
                'name' => 'Lotte Cinema Keangnam',
                'address' => 'Tầng 5, Keangnam Hanoi Landmark Tower, Phạm Hùng, Mễ Trì, Nam Từ Liêm',
                'city' => 'Hà Nội',
                'total_seats' => 340,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 14, 'cols' => 16, 'price' => 100000],
                    'platinum' => ['rows' => 5, 'cols' => 12, 'price' => 130000],
                    'box' => ['rows' => 2, 'cols' => 8, 'price' => 170000],
                ]),
                'facilities' => json_encode(['IMAX', 'Super Plex G', 'Dolby Atmos']),
                'status' => 'active',
            ],

            // ĐÀ NẴNG CINEMAS
            [
                'name' => 'CGV Vincom Đà Nẵng',
                'address' => 'Tầng 4-5, Vincom Plaza Đà Nẵng, 910A Ngô Quyền, An Hải Bắc, Sơn Trà',
                'city' => 'Đà Nẵng',
                'total_seats' => 200,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 7, 'cols' => 12, 'price' => 80000],
                    'platinum' => ['rows' => 4, 'cols' => 10, 'price' => 110000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 140000],
                ]),
                'facilities' => json_encode(['3D', 'Dolby Atmos']),
                'status' => 'active',
            ],
            [
                'name' => 'Galaxy Cinema Đà Nẵng',
                'address' => 'Tầng 5, Con Cưng Plaza, 42-44 Hùng Vương, Thạch Thang, Hải Châu',
                'city' => 'Đà Nẵng',
                'total_seats' => 180,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 6, 'cols' => 12, 'price' => 75000],
                    'platinum' => ['rows' => 4, 'cols' => 10, 'price' => 105000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 135000],
                ]),
                'facilities' => json_encode(['2D', '3D', 'Sound DTS']),
                'status' => 'active',
            ],

            // CẦN THƠ CINEMAS
            [
                'name' => 'CGV Vincom Cần Thơ',
                'address' => 'Tầng 4, Vincom Plaza Xuân Khánh, 209 Đường 30/4, Xuân Khánh, Ninh Kiều',
                'city' => 'Cần Thơ',
                'total_seats' => 170,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 6, 'cols' => 12, 'price' => 70000],
                    'platinum' => ['rows' => 3, 'cols' => 10, 'price' => 100000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 130000],
                ]),
                'facilities' => json_encode(['2D', '3D', 'Dolby Digital']),
                'status' => 'active',
            ],
            [
                'name' => 'Galaxy Cần Thơ',
                'address' => 'Tầng 3, Sense City, 6 Cách Mạng Tháng 8, Cái Khế, Ninh Kiều',
                'city' => 'Cần Thơ',
                'total_seats' => 150,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 5, 'cols' => 12, 'price' => 65000],
                    'platinum' => ['rows' => 3, 'cols' => 10, 'price' => 95000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 125000],
                ]),
                'facilities' => json_encode(['2D', '3D']),
                'status' => 'active',
            ],

            // HAI PHÒNG CINEMAS
            [
                'name' => 'CGV Vincom Hải Phòng',
                'address' => 'Tầng 4, Vincom Plaza Hải Phòng, 4-6 Trần Phú, Máy Chai, Ngô Quyền',
                'city' => 'Hải Phòng',
                'total_seats' => 190,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 7, 'cols' => 12, 'price' => 75000],
                    'platinum' => ['rows' => 3, 'cols' => 10, 'price' => 105000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 135000],
                ]),
                'facilities' => json_encode(['3D', 'Dolby Atmos']),
                'status' => 'active',
            ],

            // NHA TRANG CINEMAS
            [
                'name' => 'Galaxy Cinema Nha Trang',
                'address' => 'Tầng 4, Nha Trang Centre, 4C Nguyễn Thị Minh Khai, Vĩnh Hòa, Nha Trang',
                'city' => 'Nha Trang',
                'total_seats' => 160,
                'seat_configuration' => json_encode([
                    'gold' => ['rows' => 6, 'cols' => 12, 'price' => 70000],
                    'platinum' => ['rows' => 3, 'cols' => 10, 'price' => 100000],
                    'box' => ['rows' => 2, 'cols' => 4, 'price' => 130000],
                ]),
                'facilities' => json_encode(['2D', '3D', 'Dolby 7.1']),
                'status' => 'active',
            ],
        ];

        foreach ($theaters as $theaterData) {
            Theater::create($theaterData);
        }
    }
}
