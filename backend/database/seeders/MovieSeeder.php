<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Movie;
use Illuminate\Support\Str;

class MovieSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $movies = [
            // PHIM VIỆT NAM - ĐANG CHIẾU
            [
                'title' => 'Mai',
                'slug' => 'mai-2024',
                'synopsis' => 'Câu chuyện về một cô gái trẻ tên Mai, với cuộc sống đầy biến động giữa gia đình và tình yêu. Phim khắc họa hành trình trưởng thành của cô qua những thử thách và khó khăn trong cuộc sống.',
                'duration' => 131,
                'genre' => json_encode(['Tâm lý', 'Tình cảm', 'Gia đình']),
                'language' => 'Tiếng Việt',
                'age_rating' => 'T16',
                'release_date' => '2024-02-10',
                'poster_url' => 'https://picsum.photos/300/450?random=1',
                'trailer_url' => 'https://www.youtube.com/embed/giXco2jaZ_4',
                'cast' => json_encode([
                    ['name' => 'Phương Anh Đào', 'role' => 'Mai'],
                    ['name' => 'Tuấn Trần', 'role' => 'Dương'],
                    ['name' => 'Hồng Đào', 'role' => 'Mẹ Mai']
                ]),
                'director' => 'Trấn Thành',
                'average_rating' => 4.2,
                'total_reviews' => 1547,
                'status' => 'active',
            ],
            [
                'title' => 'Gái Già Lắm Chiêu V',
                'slug' => 'gai-gia-lam-chieu-5',
                'synopsis' => 'Phần thứ 5 của loạt phim hài đình đám, tiếp tục câu chuyện của bà Nàng và những người bạn với nhiều tình huống hài hước và ý nghĩa về tình bạn tuổi xế chiều.',
                'duration' => 113,
                'genre' => json_encode(['Hài', 'Tình cảm']),
                'language' => 'Tiếng Việt',
                'age_rating' => 'T13',
                'release_date' => '2024-03-08',
                'poster_url' => 'https://picsum.photos/300/450?random=2',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Lê Khanh', 'role' => 'Bà Nàng'],
                    ['name' => 'Kaity Nguyễn', 'role' => 'Thanh'],
                    ['name' => 'NSƯT Hồng Vân', 'role' => 'Bà Hai']
                ]),
                'director' => 'Bảo Nhân - Namcito',
                'average_rating' => 3.8,
                'total_reviews' => 892,
                'status' => 'active',
            ],
            [
                'title' => 'Lat Mặt 7: Một Điều Ước',
                'slug' => 'lat-mat-7-mot-dieu-uoc',
                'synopsis' => 'Phần 7 của series Lật Mặt đình đám, Lý Hải tiếp tục mang đến một câu chuyện đầy cảm xúc về gia đình, tình thân và những điều ước giản dị nhưng ý nghĩa.',
                'duration' => 138,
                'genre' => json_encode(['Hành động', 'Tình cảm', 'Gia đình']),
                'language' => 'Tiếng Việt',
                'age_rating' => 'T16',
                'release_date' => '2024-04-26',
                'poster_url' => 'https://picsum.photos/300/450?random=3',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Lý Hải', 'role' => 'Chính'],
                    ['name' => 'Minh Hà', 'role' => 'Lan'],
                    ['name' => 'Trương Minh Cường', 'role' => 'Tám']
                ]),
                'director' => 'Lý Hải',
                'average_rating' => 4.0,
                'total_reviews' => 1203,
                'status' => 'active',
            ],

            // PHIM QUỐC TẾ - ĐANG CHIẾU
            [
                'title' => 'Spider-Man: No Way Home',
                'slug' => 'spider-man-no-way-home',
                'synopsis' => 'Peter Parker phải đối mặt với hậu quả khi danh tính Spider-Man bị tiết lộ. Anh tìm đến Doctor Strange để xóa bỏ ký ức của mọi người, nhưng phép thuật đã mở ra multiverse nguy hiểm.',
                'duration' => 148,
                'genre' => json_encode(['Hành động', 'Khoa học viễn tưởng', 'Phiêu lưu']),
                'language' => 'Tiếng Anh',
                'age_rating' => 'T13',
                'release_date' => '2024-01-15',
                'poster_url' => 'https://picsum.photos/300/450?random=4',
                'trailer_url' => 'https://www.youtube.com/embed/JfVOs4VSpmA',
                'cast' => json_encode([
                    ['name' => 'Tom Holland', 'role' => 'Peter Parker / Spider-Man'],
                    ['name' => 'Zendaya', 'role' => 'MJ'],
                    ['name' => 'Benedict Cumberbatch', 'role' => 'Doctor Strange']
                ]),
                'director' => 'Jon Watts',
                'average_rating' => 4.7,
                'total_reviews' => 2841,
                'status' => 'active',
            ],
            [
                'title' => 'Avatar: The Way of Water',
                'slug' => 'avatar-the-way-of-water',
                'synopsis' => 'Hơn một thập kỷ sau những sự kiện của phần đầu, Avatar: The Way of Water kể về gia đình của Jake Sully, những rắc rối theo họ, những gì họ phải làm để đảm bảo an toàn cho nhau.',
                'duration' => 192,
                'genre' => json_encode(['Khoa học viễn tưởng', 'Phiêu lưu', 'Gia đình']),
                'language' => 'Tiếng Anh',
                'age_rating' => 'T13',
                'release_date' => '2024-01-20',
                'poster_url' => 'https://picsum.photos/300/450?random=5',
                'trailer_url' => 'https://www.youtube.com/embed/d9MyW72ELq0',
                'cast' => json_encode([
                    ['name' => 'Sam Worthington', 'role' => 'Jake Sully'],
                    ['name' => 'Zoe Saldana', 'role' => 'Neytiri'],
                    ['name' => 'Sigourney Weaver', 'role' => 'Kiri']
                ]),
                'director' => 'James Cameron',
                'average_rating' => 4.5,
                'total_reviews' => 1967,
                'status' => 'active',
            ],
            [
                'title' => 'Top Gun: Maverick',
                'slug' => 'top-gun-maverick',
                'synopsis' => 'Sau hơn ba mười năm phục vụ như một phi công hàng đầu của Hải quân, Pete "Maverick" Mitchell đang ở nơi anh thuộc về, đẩy những giới hạn như một phi công thử nghiệm dũng cảm.',
                'duration' => 131,
                'genre' => json_encode(['Hành động', 'Chiến tranh', 'Phiêu lưu']),
                'language' => 'Tiếng Anh',
                'age_rating' => 'T13',
                'release_date' => '2024-02-14',
                'poster_url' => 'https://picsum.photos/300/450?random=6',
                'trailer_url' => 'https://www.youtube.com/embed/WGt-8adyabk',
                'cast' => json_encode([
                    ['name' => 'Tom Cruise', 'role' => 'Pete "Maverick" Mitchell'],
                    ['name' => 'Miles Teller', 'role' => 'Bradley "Rooster" Bradshaw'],
                    ['name' => 'Jennifer Connelly', 'role' => 'Penny Benjamin']
                ]),
                'director' => 'Joseph Kosinski',
                'average_rating' => 4.6,
                'total_reviews' => 2156,
                'status' => 'active',
            ],

            // PHIM HÀN QUỐC
            [
                'title' => 'Parasite',
                'slug' => 'parasite-korean',
                'synopsis' => 'Bộ phim kể về gia đình nghèo Ki-taek sống trong tầng hầm bán ngầm. Họ tìm cách thâm nhập vào gia đình giàu có Park thông qua việc làm gia sư cho con gái nhà Park.',
                'duration' => 132,
                'genre' => json_encode(['Kinh dị', 'Hài đen', 'Tâm lý']),
                'language' => 'Tiếng Hàn',
                'age_rating' => 'T16',
                'release_date' => '2024-03-15',
                'poster_url' => 'https://picsum.photos/300/450?random=7',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Song Kang-ho', 'role' => 'Ki-taek'],
                    ['name' => 'Lee Sun-kyun', 'role' => 'Park Dong-ik'],
                    ['name' => 'Cho Yeo-jeong', 'role' => 'Choi Yeon-gyo']
                ]),
                'director' => 'Bong Joon-ho',
                'average_rating' => 4.8,
                'total_reviews' => 1834,
                'status' => 'active',
            ],
            [
                'title' => 'Train to Busan',
                'slug' => 'train-to-busan',
                'synopsis' => 'Một đại dịch zombie bùng phát ở Hàn Quốc. Seok-woo và con gái Su-an lên chuyến tàu KTX từ Seoul đến Busan, nhưng trên đường đi họ phải đối mặt với thảm họa zombie.',
                'duration' => 118,
                'genre' => json_encode(['Kinh dị', 'Hành động', 'Zombie']),
                'language' => 'Tiếng Hàn',
                'age_rating' => 'T16',
                'release_date' => '2024-03-22',
                'poster_url' => 'https://picsum.photos/300/450?random=8',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Gong Yoo', 'role' => 'Seok-woo'],
                    ['name' => 'Jung Yu-mi', 'role' => 'Sung-kyung'],
                    ['name' => 'Ma Dong-seok', 'role' => 'Sang-hwa']
                ]),
                'director' => 'Yeon Sang-ho',
                'average_rating' => 4.4,
                'total_reviews' => 1456,
                'status' => 'active',
            ],

            // PHIM HOẠT HÌNH
            [
                'title' => 'Doraemon: Nobita và Vùng Đất Lý Tưởng Trên Bầu Trời',
                'slug' => 'doraemon-nobita-vung-dat-ly-tuong',
                'synopsis' => 'Nobita tìm thấy một hòn đảo hình trăng lưỡi liềm trên bầu trời và cùng Doraemon khám phá vùng đất lý tưởng Utopia. Tại đây, mọi người đều hoàn hảo và không ai phạm lỗi.',
                'duration' => 108,
                'genre' => json_encode(['Hoạt hình', 'Gia đình', 'Phiêu lưu']),
                'language' => 'Tiếng Nhật',
                'age_rating' => 'P',
                'release_date' => '2024-06-01',
                'poster_url' => 'https://picsum.photos/300/450?random=15',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Megumi Oohara', 'role' => 'Nobita'],
                    ['name' => 'Wasabi Mizuta', 'role' => 'Doraemon'],
                    ['name' => 'Yumi Kakazu', 'role' => 'Shizuka']
                ]),
                'director' => 'Takumi Doyama',
                'average_rating' => 4.3,
                'total_reviews' => 567,
                'status' => 'active',
            ],
            [
                'title' => 'Turning Red',
                'slug' => 'turning-red',
                'synopsis' => 'Câu chuyện về Mei Lee, một cô gái 13 tuổi tự tin và hơi bướng bỉnh, đang trong độ tuổi dậy thì khó khăn. Và như thể những thay đổi về sở thích, mối quan hệ và cơ thể chưa đủ, bất cứ khi nào cô ấy quá phấn khích, cô ấy sẽ "poof" biến thành một con gấu trúc đỏ khổng lồ!',
                'duration' => 100,
                'genre' => json_encode(['Hoạt hình', 'Gia đình', 'Hài']),
                'language' => 'Tiếng Anh',
                'age_rating' => 'P',
                'release_date' => '2024-05-15',
                'poster_url' => 'https://picsum.photos/300/450?random=16',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Rosalie Chiang', 'role' => 'Mei Lee'],
                    ['name' => 'Sandra Oh', 'role' => 'Ming'],
                    ['name' => 'Ava Morse', 'role' => 'Miriam']
                ]),
                'director' => 'Domee Shi',
                'average_rating' => 4.1,
                'total_reviews' => 892,
                'status' => 'active',
            ],

            // PHIM KINH DỊ
            [
                'title' => 'Ma Lai',
                'slug' => 'ma-lai',
                'synopsis' => 'Câu chuyện về một gia đình chuyển đến ngôi nhà mới và phát hiện ra những bí mật đen tối từ quá khứ. Những hiện tượng siêu nhiên bắt đầu xảy ra và họ phải đối mặt với thế lực ma quỷ.',
                'duration' => 95,
                'genre' => json_encode(['Kinh dị', 'Tâm lý']),
                'language' => 'Tiếng Việt',
                'age_rating' => 'T18',
                'release_date' => '2024-07-31',
                'poster_url' => 'https://picsum.photos/300/450?random=17',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Hồng Ánh', 'role' => 'Lan'],
                    ['name' => 'Huy Khánh', 'role' => 'Nam'],
                    ['name' => 'Lâm Thanh Mỹ', 'role' => 'Bé An']
                ]),
                'director' => 'Nguyễn Hữu Hoàng',
                'average_rating' => 3.7,
                'total_reviews' => 734,
                'status' => 'active',
            ],
            [
                'title' => 'The Conjuring: The Devil Made Me Do It',
                'slug' => 'the-conjuring-devil-made-me-do-it',
                'synopsis' => 'Ed và Lorraine Warren điều tra một vụ giết người có thể liên quan đến quỷ dữ và là lần đầu tiên trong lịch sử nước Mỹ, một nghi phạm giết người tuyên bố bị quỷ ám như một biện pháp bào chữa.',
                'duration' => 112,
                'genre' => json_encode(['Kinh dị', 'Siêu nhiên', 'Tâm lý']),
                'language' => 'Tiếng Anh',
                'age_rating' => 'T18',
                'release_date' => '2024-06-18',
                'poster_url' => 'https://picsum.photos/300/450?random=18',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Patrick Wilson', 'role' => 'Ed Warren'],
                    ['name' => 'Vera Farmiga', 'role' => 'Lorraine Warren'],
                    ['name' => 'Ruairi O\'Connor', 'role' => 'Arne Cheyenne Johnson']
                ]),
                'director' => 'Michael Chaves',
                'average_rating' => 4.2,
                'total_reviews' => 1456,
                'status' => 'active',
            ],

            // PHIM SẮP CHIẾU
            [
                'title' => 'Dune: Part Two',
                'slug' => 'dune-part-two',
                'synopsis' => 'Paul Atreides hợp nhất với Chani và Fremen trong cuộc chiến báo thù chống lại những kẻ âm mưu hủy diệt gia đình anh. Đối mặt với sự lựa chọn giữa tình yêu và số phận của vũ trụ.',
                'duration' => 155,
                'genre' => json_encode(['Khoa học viễn tưởng', 'Phiêu lưu', 'Hành động']),
                'language' => 'Tiếng Anh',
                'age_rating' => 'T13',
                'release_date' => '2024-09-15',
                'poster_url' => 'https://picsum.photos/300/450?random=9',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Timothée Chalamet', 'role' => 'Paul Atreides'],
                    ['name' => 'Zendaya', 'role' => 'Chani'],
                    ['name' => 'Rebecca Ferguson', 'role' => 'Lady Jessica']
                ]),
                'director' => 'Denis Villeneuve',
                'average_rating' => 0.0,
                'total_reviews' => 0,
                'status' => 'coming_soon',
            ],
            [
                'title' => 'Guardians of the Galaxy Vol. 3',
                'slug' => 'guardians-of-the-galaxy-vol-3',
                'synopsis' => 'Peter Quill vẫn còn đau buồn vì mất Gamora, phải tập hợp đội của mình để bảo vệ vũ trụ và bảo vệ một trong những thành viên của họ - một nhiệm vụ có thể kết thúc Guardians nếu không thành công.',
                'duration' => 150,
                'genre' => json_encode(['Hành động', 'Khoa học viễn tưởng', 'Hài']),
                'language' => 'Tiếng Anh',
                'age_rating' => 'T13',
                'release_date' => '2024-10-05',
                'poster_url' => 'https://picsum.photos/300/450?random=10',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Chris Pratt', 'role' => 'Peter Quill / Star-Lord'],
                    ['name' => 'Zoe Saldana', 'role' => 'Gamora'],
                    ['name' => 'Dave Bautista', 'role' => 'Drax']
                ]),
                'director' => 'James Gunn',
                'average_rating' => 0.0,
                'total_reviews' => 0,
                'status' => 'coming_soon',
            ],
            [
                'title' => 'Fast X',
                'slug' => 'fast-x',
                'synopsis' => 'Trong nhiều nhiệm vụ và chống lại mọi tỷ lệ cược, Dom Toretto và gia đình anh đã vượt qua mọi kẻ thù trên đường đi. Giờ đây, họ đối mặt với đối thủ tàn nhẫn nhất từng thấy.',
                'duration' => 141,
                'genre' => json_encode(['Hành động', 'Phiêu lưu', 'Tội phạm']),
                'language' => 'Tiếng Anh',
                'age_rating' => 'T13',
                'release_date' => '2024-11-10',
                'poster_url' => 'https://picsum.photos/300/450?random=11',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Vin Diesel', 'role' => 'Dominic Toretto'],
                    ['name' => 'Michelle Rodriguez', 'role' => 'Letty'],
                    ['name' => 'Tyrese Gibson', 'role' => 'Roman']
                ]),
                'director' => 'Louis Leterrier',
                'average_rating' => 0.0,
                'total_reviews' => 0,
                'status' => 'coming_soon',
            ],

            // PHIM ANIME/HOẠT HÌNH
            [
                'title' => 'Your Name',
                'slug' => 'your-name-kimi-no-na-wa',
                'synopsis' => 'Mitsuha, một nữ sinh trung học sống ở vùng nông thôn, và Taki, một nam sinh sống ở Tokyo, bắt đầu hoán đổi cơ thể một cách bí ẩn và dần dần phát triển mối liên kết đặc biệt.',
                'duration' => 106,
                'genre' => json_encode(['Anime', 'Tình cảm', 'Siêu nhiên']),
                'language' => 'Tiếng Nhật',
                'age_rating' => 'T13',
                'release_date' => '2024-04-12',
                'poster_url' => 'https://picsum.photos/300/450?random=12',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Ryunosuke Kamiki', 'role' => 'Taki Tachibana'],
                    ['name' => 'Mone Kamishiraishi', 'role' => 'Mitsuha Miyamizu'],
                    ['name' => 'Masami Nagasawa', 'role' => 'Miki Okudera']
                ]),
                'director' => 'Makoto Shinkai',
                'average_rating' => 4.7,
                'total_reviews' => 967,
                'status' => 'active',
            ],
            [
                'title' => 'Spirited Away',
                'slug' => 'spirited-away',
                'synopsis' => 'Chihiro, một cô bé 10 tuổi, cùng bố mẹ lạc vào thế giới thần linh. Để cứu bố mẹ khỏi lời nguyền, cô phải làm việc tại nhà tắm của phù thủy Yubaba.',
                'duration' => 125,
                'genre' => json_encode(['Anime', 'Gia đình', 'Phiêu lưu']),
                'language' => 'Tiếng Nhật',
                'age_rating' => 'T10',
                'release_date' => '2024-05-01',
                'poster_url' => 'https://picsum.photos/300/450?random=13',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Rumi Hiiragi', 'role' => 'Chihiro'],
                    ['name' => 'Miyu Irino', 'role' => 'Haku'],
                    ['name' => 'Mari Natsuki', 'role' => 'Yubaba']
                ]),
                'director' => 'Hayao Miyazaki',
                'average_rating' => 4.9,
                'total_reviews' => 1245,
                'status' => 'active',
            ],

            // THÊM PHIM VIỆT NAM MỚI
            [
                'title' => 'Nhà Bà Nữ',
                'slug' => 'nha-ba-nu',
                'synopsis' => 'Câu chuyện về một gia đình ba thế hệ phụ nữ cùng sống chung dưới một mái nhà, với những xung đột, hiểu lầm và yêu thương qua từng thế hệ.',
                'duration' => 122,
                'genre' => json_encode(['Tâm lý', 'Gia đình', 'Tình cảm']),
                'language' => 'Tiếng Việt',
                'age_rating' => 'T13',
                'release_date' => '2024-08-30',
                'poster_url' => 'https://picsum.photos/300/450?random=30',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'NSƯT Lê Thiện', 'role' => 'Bà Nữ'],
                    ['name' => 'Uyển Ân', 'role' => 'Linh'],
                    ['name' => 'Anh Tú', 'role' => 'Đức']
                ]),
                'director' => 'Trương Minh Quý',
                'average_rating' => 4.1,
                'total_reviews' => 456,
                'status' => 'coming_soon',
            ],
            [
                'title' => 'Quỷ Lùn',
                'slug' => 'quy-lun',
                'synopsis' => 'Một gia đình chuyển về làng quê sống cùng ông bà, nhưng sớm phát hiện ra những điều bí ẩn và đáng sợ về căn nhà cũ kỹ này.',
                'duration' => 98,
                'genre' => json_encode(['Kinh dị', 'Tâm lý']),
                'language' => 'Tiếng Việt',
                'age_rating' => 'T18',
                'release_date' => '2024-09-12',
                'poster_url' => 'https://picsum.photos/300/450?random=31',
                'trailer_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'cast' => json_encode([
                    ['name' => 'Hồng Ánh', 'role' => 'Mẹ Mai'],
                    ['name' => 'Võ Điền Gia Huy', 'role' => 'Bé Minh'],
                    ['name' => 'Lâm Thanh Mỹ', 'role' => 'Cô Út']
                ]),
                'director' => 'Lưu Thành Luân',
                'average_rating' => 3.9,
                'total_reviews' => 234,
                'status' => 'coming_soon',
            ],
        ];

        foreach ($movies as $movieData) {
            Movie::create($movieData);
        }
    }
}
