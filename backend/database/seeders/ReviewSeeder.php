<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Review;
use App\Models\Movie;
use App\Models\User;

class ReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create some sample users for reviews
        $users = [
            [
                'name' => 'Nguyễn Văn Minh',
                'email' => 'minh.nguyen@gmail.com',
                'phone' => '0901234567',
                'password' => bcrypt('password123'),
                'preferred_city' => 'TP.HCM',
            ],
            [
                'name' => 'Trần Thị Lan',
                'email' => 'lan.tran@gmail.com',
                'phone' => '0912345678',
                'password' => bcrypt('password123'),
                'preferred_city' => 'Hà Nội',
            ],
            [
                'name' => 'Lê Hoàng Nam',
                'email' => 'nam.le@gmail.com',
                'phone' => '0923456789',
                'password' => bcrypt('password123'),
                'preferred_city' => 'Đà Nẵng',
            ],
            [
                'name' => 'Phạm Thị Hạnh',
                'email' => 'hanh.pham@gmail.com',
                'phone' => '0934567890',
                'password' => bcrypt('password123'),
                'preferred_city' => 'TP.HCM',
            ],
            [
                'name' => 'Võ Minh Tuấn',
                'email' => 'tuan.vo@gmail.com',
                'phone' => '0945678901',
                'password' => bcrypt('password123'),
                'preferred_city' => 'Hà Nội',
            ],
        ];
        
        // Create users if they don't exist
        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
        
        $allUsers = User::all();
        $movies = Movie::all();
        
        // Sample reviews with Vietnamese comments
        $reviewTemplates = [
            // 5-star reviews
            [
                'rating' => 5,
                'comments' => [
                    'Phim tuyệt vời! Tôi rất thích cảnh quay và câu chuyện. Đáng xem!',
                    'Tuyệt tác điện ảnh! Kỹ xảo đẹp mắt, diễn xuất tốt. Highly recommended!',
                    'Phim hay quá! Câu chuyện sâu sắc, dinh dưỡng đệ cao cảm xúc. 10/10!',
                    'Một tác phẩm đẳng cấp quốc tế. Đã xem 2 lần và vẫn muốn xem lại.',
                    'Phim làm tôi khóc và cười. Cảm xúc tràn trề và chân thực.',
                ]
            ],
            // 4-star reviews
            [
                'rating' => 4,
                'comments' => [
                    'Phim hay, câu chuyện hấp dẫn. Có vài đoạn hơi dài nhưng tổng thể rất tốt.',
                    'Diễn viên diễn tốt, kỹ xảo đẹp. Đáng đi xem với gia đình.',
                    'Nội dung thú vị, âm nhạc hay. Tôi đánh giá cao bộ phim này.',
                    'Phim có thông điệp ý nghĩa, kỹ xảo đẹp mắt. Recommended!',
                    'Nhịp độ nhanh, hành động kịch tính. Giải trí tốt.',
                ]
            ],
            // 3-star reviews
            [
                'rating' => 3,
                'comments' => [
                    'Phim ổn, không quá ấn tượng nhưng cũng không tệ. Xem để giải trí.',
                    'Câu chuyện bình thường, kỹ xảo tạm được. Có thể xem 1 lần.',
                    'Nội dung hơi nhạt nhàt, một vài đoạn hay nhưng không để lại ấn tượng.',
                    'Phim tạm được, thích hợp xem cuối tuần để thư giãn.',
                    'Không tồi tệ nhưng cũng không xuất sắc. Trung bình khá.',
                ]
            ],
            // 2-star reviews
            [
                'rating' => 2,
                'comments' => [
                    'Phim dài dòng, câu chuyện nhạt nhàt. Không đáng tiền vé.',
                    'Kịch bản yếu, diễn xuất cường nhét. Thất vọng.',
                    'Mong đợi nhiều nhưng kết quả không như ý. Có thể bỏ qua.',
                    'Nội dung lặp lại, thiếu sáng tạo. Không hấp dẫn.',
                    'Phim dắt, ít điểm sáng. Không khuyến khích xem.',
                ]
            ],
            // 1-star reviews
            [
                'rating' => 1,
                'comments' => [
                    'Phim dở tệ hại! Lãng phí thời gian và tiền bạc.',
                    'Tồi tệ nhất! Không hiểu sao lại làm ra được phim này.',
                    'Không có gì để nói. Chỉ muốn quên đi sớm nhất.',
                    'Thất vọng với chất lượng phim. Không đáng xem.',
                    'Phim tệ, acting kém, câu chuyện vô lý. Nhức đầu!',
                ]
            ],
        ];
        
        // Generate reviews for each movie
        foreach ($movies as $movie) {
            // Number of reviews per movie (5-25 reviews)
            $reviewCount = rand(5, 25);
            
            // Calculate movie average rating based on review distribution
            $totalRating = 0;
            $reviewsToCreate = [];
            $usedUsers = []; // Track which users have already reviewed this movie
            
            for ($i = 0; $i < $reviewCount; $i++) {
                // Weight distribution towards higher ratings (more realistic)
                $ratingWeights = [1 => 5, 2 => 10, 3 => 20, 4 => 35, 5 => 30];
                $randomValue = rand(1, 100);
                $rating = 5;
                
                $cumulative = 0;
                foreach ($ratingWeights as $r => $weight) {
                    $cumulative += $weight;
                    if ($randomValue <= $cumulative) {
                        $rating = $r;
                        break;
                    }
                }
                
                // Get random comment for this rating
                $ratingTemplate = array_values(array_filter($reviewTemplates, function($template) use ($rating) {
                    return $template['rating'] === $rating;
                }))[0];
                
                $comment = $ratingTemplate['comments'][array_rand($ratingTemplate['comments'])];
                
                // Get a user that hasn't reviewed this movie yet
                $availableUsers = $allUsers->reject(function($user) use ($usedUsers) {
                    return in_array($user->id, $usedUsers);
                });
                
                // If no available users, break (unlikely but safe)
                if ($availableUsers->isEmpty()) {
                    break;
                }
                
                $user = $availableUsers->random();
                $usedUsers[] = $user->id; // Mark this user as used for this movie
                
                $reviewsToCreate[] = [
                    'user_id' => $user->id,
                    'movie_id' => $movie->id,
                    'rating' => $rating,
                    'comment' => $comment,
                    'status' => 'approved',
                    'created_at' => now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
                ];
                
                $totalRating += $rating;
            }
            
            // Create all reviews for this movie
            foreach ($reviewsToCreate as $reviewData) {
                Review::create($reviewData);
            }
            
            // Update movie average rating and total reviews
            $actualReviewCount = count($reviewsToCreate);
            if ($actualReviewCount > 0) {
                $averageRating = round($totalRating / $actualReviewCount, 2);
                $movie->update([
                    'average_rating' => $averageRating,
                    'total_reviews' => $actualReviewCount,
                ]);
            }
        }
    }
}
