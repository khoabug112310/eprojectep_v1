<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Movie;

class MovieSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if movies already exist to avoid duplication
        if (Movie::count() > 0) {
            $this->command->info('Movies already exist in the database. Skipping movie seeding.');
            return;
        }

        // Vietnamese movies
        $vietnameseMovies = [
            [
                'title' => 'Em Chưa 18',
                'synopsis' => 'Câu chuyện tình yêu tuổi học trò đầy cảm xúc, hài hước và trong sáng giữa hai nhân vật chính Linh và Bin. Phim khắc họa chân thực tuổi thanh xuân với những rung động đầu đời, những trăn trở và khát khao của tuổi trẻ.',
                'duration' => 110,
                'genre' => json_encode(['Drama', 'Romance', 'Comedy']),
                'language' => 'Vietnamese',
                'age_rating' => 'PG-13',
                'release_date' => '2024-06-15',
                'poster_url' => 'https://picsum.photos/500/750?random=11',
                'trailer_url' => 'https://www.youtube.com/watch?v=VNmVrE2v3ZA',
                'cast' => json_encode([
                    ['name' => 'Kiều Minh Tuấn', 'role' => 'Lead'],
                    ['name' => 'Ngọc Thảo', 'role' => 'Lead'],
                    ['name' => 'Johnny Trí Nguyễn', 'role' => 'Support']
                ]),
                'director' => 'Ngô Thanh Vân',
                'status' => 'active',
            ],
            [
                'title' => 'Mắt Biếc',
                'synopsis' => 'Câu chuyện tình đơn phương đầy day dứt của chàng trai trẻ dành cho cô gái đẹp trong thanh xuân của anh. Phim chuyển thể từ tiểu thuyết cùng tên của Nguyễn Nhật Ánh, khắc họa tinh tế cảm xúc yêu thương, mất mát và sự trưởng thành.',
                'duration' => 125,
                'genre' => json_encode(['Drama', 'Romance']),
                'language' => 'Vietnamese',
                'age_rating' => 'PG',
                'release_date' => '2024-07-20',
                'poster_url' => 'https://picsum.photos/500/750?random=12',
                'trailer_url' => 'https://www.youtube.com/watch?v=QHGoU8vX53c',
                'cast' => json_encode([
                    ['name' => 'Trần Phong', 'role' => 'Lead'],
                    ['name' => 'Hà Anh', 'role' => 'Lead'],
                    ['name' => 'Lan Ngọc', 'role' => 'Support']
                ]),
                'director' => 'Victor Vũ',
                'status' => 'active',
            ],
            [
                'title' => 'Hai Phượng',
                'synopsis' => 'Một bà mẹ đơn thân với quá khứ huyền thoại trong thế giới ngầm quyết tâm giải cứu con gái khỏi tay bọn buôn người. Phim hành động mãn nhãn với những pha võ thuật đỉnh cao và kịch tính.',
                'duration' => 138,
                'genre' => json_encode(['Action', 'Thriller']),
                'language' => 'Vietnamese',
                'age_rating' => 'R',
                'release_date' => '2024-05-10',
                'poster_url' => 'https://picsum.photos/500/750?random=13',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Ngô Thanh Vân', 'role' => 'Lead'],
                    ['name' => 'Jun Vũ', 'role' => 'Support'],
                    ['name' => 'Trấn Thành', 'role' => 'Support']
                ]),
                'director' => 'Lê Văn Kiệt',
                'status' => 'active',
            ],
            [
                'title' => 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
                'synopsis' => 'Câu chuyện tuổi thơ nghèo khó nhưng đầy ắp những kỷ niệm đẹp ở một làng quê Việt Nam những năm 1980. Phim mang đến cảm xúc chân thật về tình anh em, tình bạn và sự trưởng thành.',
                'duration' => 145,
                'genre' => json_encode(['Drama', 'Family']),
                'language' => 'Vietnamese',
                'age_rating' => 'PG',
                'release_date' => '2024-08-30',
                'poster_url' => 'https://picsum.photos/500/750?random=14',
                'trailer_url' => 'https://www.youtube.com/watch?v=8Bf-BcJkT4I',
                'cast' => json_encode([
                    ['name' => 'Hoàng Dũng', 'role' => 'Lead'],
                    ['name' => 'Kiều Diễm', 'role' => 'Support'],
                    ['name' => 'NSND Đỗ Thanh Hải', 'role' => 'Support']
                ]),
                'director' => 'Phan Đăng Di',
                'status' => 'active',
            ],
            [
                'title' => 'Cô Ba Sài Gòn',
                'synopsis' => 'Câu chuyện về một cô gái Sài Gòn yêu nghề may và văn hóa áo dài truyền thống. Khi phải đối mặt với áp lực từ thời trang hiện đại, cô quyết tâm giữ gìn và phát huy giá trị truyền thống.',
                'duration' => 105,
                'genre' => json_encode(['Drama', 'Romance']),
                'language' => 'Vietnamese',
                'age_rating' => 'PG',
                'release_date' => '2024-09-05',
                'poster_url' => 'https://picsum.photos/500/750?random=15',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Ngô Thanh Vân', 'role' => 'Lead'],
                    ['name' => 'Tuấn Trần', 'role' => 'Lead'],
                    ['name' => 'Châu Bùi', 'role' => 'Support']
                ]),
                'director' => 'Trấn Thành',
                'status' => 'active',
            ],
            [
                'title' => 'Sài Gòn Trong Tôi',
                'synopsis' => 'Bộ phim tình cảm về mối quan hệ giữa ba thế hệ trong một gia đình Sài Gòn. Phim khắc họa chân thực cuộc sống đô thị hiện đại và những giá trị truyền thống được gìn giữ.',
                'duration' => 120,
                'genre' => json_encode(['Drama', 'Family']),
                'language' => 'Vietnamese',
                'age_rating' => 'PG',
                'release_date' => '2024-09-15',
                'poster_url' => 'https://picsum.photos/500/750?random=16',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'NSND Hồng Vân', 'role' => 'Lead'],
                    ['name' => 'Hồng Diễm', 'role' => 'Lead'],
                    ['name' => 'Mai Thu Huyền', 'role' => 'Support']
                ]),
                'director' => 'Huỳnh Đông',
                'status' => 'active',
            ],
            [
                'title' => 'Thợ Săn Ma Cà Rồng',
                'synopsis' => 'Một nhóm thợ săn ma cà rồng trẻ tuổi phải đối mặt với thế lực hắc ám đang đe dọa thế giới. Phim hành động kinh dị với nhiều pha chiến đấu mãn nhãn và hiệu ứng đặc biệt ấn tượng.',
                'duration' => 130,
                'genre' => json_encode(['Action', 'Horror', 'Fantasy']),
                'language' => 'Vietnamese',
                'age_rating' => 'R',
                'release_date' => '2024-10-01',
                'poster_url' => 'https://picsum.photos/500/750?random=17',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Anh Tú', 'role' => 'Lead'],
                    ['name' => 'Phương Anh Đào', 'role' => 'Lead'],
                    ['name' => 'Mai Thu Huyền', 'role' => 'Support']
                ]),
                'director' => 'Lê Văn Kiệt',
                'status' => 'active',
            ],
            [
                'title' => 'Chị Mười Ba',
                'synopsis' => 'Câu chuyện hài hước về một cô gái quê lên Sài Gòn lập nghiệp và những rắc rối cô gặp phải. Phim mang đến nhiều tiếng cười và thông điệp tích cực về sự kiên trì và bản lĩnh.',
                'duration' => 115,
                'genre' => json_encode(['Comedy', 'Drama']),
                'language' => 'Vietnamese',
                'age_rating' => 'PG-13',
                'release_date' => '2024-10-20',
                'poster_url' => 'https://picsum.photos/500/750?random=18',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Thu Trang', 'role' => 'Lead'],
                    ['name' => 'Đức Thịnh', 'role' => 'Lead'],
                    ['name' => 'Trấn Thành', 'role' => 'Support']
                ]),
                'director' => 'Trấn Thành',
                'status' => 'active',
            ],
            [
                'title' => 'Đôi Mắt',
                'synopsis' => 'Một câu chuyện tâm lý ly kỳ về khả năng nhìn thấy tương lai qua đôi mắt đặc biệt. Phim khám phá các chủ đề về số phận, lựa chọn và hệ quả của những quyết định trong cuộc sống.',
                'duration' => 140,
                'genre' => json_encode(['Drama', 'Thriller', 'Mystery']),
                'language' => 'Vietnamese',
                'age_rating' => 'PG-13',
                'release_date' => '2024-11-05',
                'poster_url' => 'https://picsum.photos/500/750?random=19',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Hứa Vĩ Văn', 'role' => 'Lead'],
                    ['name' => 'Midu', 'role' => 'Lead'],
                    ['name' => 'NSND Lê Khanh', 'role' => 'Support']
                ]),
                'director' => 'Phan Gia Nhật Linh',
                'status' => 'active',
            ],
        ];

        // International movies
        $internationalMovies = [
            [
                'title' => 'Dune: Part Two',
                'synopsis' => 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he must prevent a terrible future only he can foresee.',
                'duration' => 166,
                'genre' => json_encode(['Sci-Fi', 'Adventure', 'Drama']),
                'language' => 'English',
                'age_rating' => 'PG-13',
                'release_date' => '2024-03-01',
                'poster_url' => 'https://picsum.photos/500/750?random=20',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Timothée Chalamet', 'role' => 'Lead'],
                    ['name' => 'Zendaya', 'role' => 'Lead'],
                    ['name' => 'Rebecca Ferguson', 'role' => 'Support']
                ]),
                'director' => 'Denis Villeneuve',
                'status' => 'active',
            ],
            [
                'title' => 'Oppenheimer',
                'synopsis' => 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
                'duration' => 180,
                'genre' => json_encode(['Biography', 'Drama', 'History']),
                'language' => 'English',
                'age_rating' => 'R',
                'release_date' => '2024-07-21',
                'poster_url' => 'https://picsum.photos/500/750?random=21',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Cillian Murphy', 'role' => 'Lead'],
                    ['name' => 'Emily Blunt', 'role' => 'Lead'],
                    ['name' => 'Matt Damon', 'role' => 'Support']
                ]),
                'director' => 'Christopher Nolan',
                'status' => 'active',
            ],
            [
                'title' => 'Spider-Man: Across the Spider-Verse',
                'synopsis' => 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.',
                'duration' => 140,
                'genre' => json_encode(['Animation', 'Action', 'Adventure']),
                'language' => 'English',
                'age_rating' => 'PG',
                'release_date' => '2024-06-02',
                'poster_url' => 'https://picsum.photos/500/750?random=22',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Shameik Moore', 'role' => 'Lead'],
                    ['name' => 'Hailee Steinfeld', 'role' => 'Lead'],
                    ['name' => 'Brian Tyree Henry', 'role' => 'Support']
                ]),
                'director' => 'Joaquim Dos Santos',
                'status' => 'active',
            ],
            [
                'title' => 'John Wick: Chapter 4',
                'synopsis' => 'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes.',
                'duration' => 169,
                'genre' => json_encode(['Action', 'Crime', 'Thriller']),
                'language' => 'English',
                'age_rating' => 'R',
                'release_date' => '2024-03-24',
                'poster_url' => 'https://picsum.photos/500/750?random=23',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Keanu Reeves', 'role' => 'Lead'],
                    ['name' => 'Donnie Yen', 'role' => 'Support'],
                    ['name' => 'Bill Skarsgård', 'role' => 'Support']
                ]),
                'director' => 'Chad Stahelski',
                'status' => 'active',
            ],
            [
                'title' => 'Fast X',
                'synopsis' => 'Over many missions and against impossible odds, Dom Toretto and his family have outsmarted and outdriven every foe in their path. Now, they must confront the most lethal opponent they have ever faced. Fueled by revenge, a terrifying threat emerges from the shadows of the past to shatter this world and destroy everything that Dom loves.',
                'duration' => 141,
                'genre' => json_encode(['Action', 'Crime', 'Thriller']),
                'language' => 'English',
                'age_rating' => 'PG-13',
                'release_date' => '2024-05-19',
                'poster_url' => 'https://picsum.photos/500/750?random=24',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Vin Diesel', 'role' => 'Lead'],
                    ['name' => 'Michelle Rodriguez', 'role' => 'Lead'],
                    ['name' => 'Jason Statham', 'role' => 'Support']
                ]),
                'director' => 'Louis Leterrier',
                'status' => 'active',
            ],
            [
                'title' => 'Guardians of the Galaxy Vol. 3',
                'synopsis' => 'Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe and protect one of their own. When the team\'s mission is jeopardized, Rocket proves that his life can have a huge impact.',
                'duration' => 150,
                'genre' => json_encode(['Action', 'Adventure', 'Comedy']),
                'language' => 'English',
                'age_rating' => 'PG-13',
                'release_date' => '2024-05-05',
                'poster_url' => 'https://picsum.photos/500/750?random=25',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Chris Pratt', 'role' => 'Lead'],
                    ['name' => 'Zoe Saldana', 'role' => 'Lead'],
                    ['name' => 'Dave Bautista', 'role' => 'Support']
                ]),
                'director' => 'James Gunn',
                'status' => 'active',
            ],
            [
                'title' => 'Mission: Impossible - Dead Reckoning Part One',
                'synopsis' => 'Ethan Hunt and his IMF team must track down a terrifying new weapon that threatens all of humanity if it falls into the wrong hands. With the fate of the world at stake, a deadly race around the globe begins.',
                'duration' => 163,
                'genre' => json_encode(['Action', 'Adventure', 'Thriller']),
                'language' => 'English',
                'age_rating' => 'PG-13',
                'release_date' => '2024-07-12',
                'poster_url' => 'https://picsum.photos/500/750?random=26',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Tom Cruise', 'role' => 'Lead'],
                    ['name' => 'Hayley Atwell', 'role' => 'Lead'],
                    ['name' => 'Ving Rhames', 'role' => 'Support']
                ]),
                'director' => 'Christopher McQuarrie',
                'status' => 'active',
            ],
            [
                'title' => 'Barbie',
                'synopsis' => 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover it can be a messy place.',
                'duration' => 114,
                'genre' => json_encode(['Adventure', 'Comedy', 'Fantasy']),
                'language' => 'English',
                'age_rating' => 'PG-13',
                'release_date' => '2024-07-21',
                'poster_url' => 'https://picsum.photos/500/750?random=27',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Margot Robbie', 'role' => 'Lead'],
                    ['name' => 'Ryan Gosling', 'role' => 'Lead'],
                    ['name' => 'America Ferrera', 'role' => 'Support']
                ]),
                'director' => 'Greta Gerwig',
                'status' => 'active',
            ],
            [
                'title' => 'Avatar: The Way of Water',
                'synopsis' => 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
                'duration' => 192,
                'genre' => json_encode(['Action', 'Adventure', 'Fantasy']),
                'language' => 'English',
                'age_rating' => 'PG-13',
                'release_date' => '2024-12-16',
                'poster_url' => 'https://picsum.photos/500/750?random=28',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Sam Worthington', 'role' => 'Lead'],
                    ['name' => 'Zoe Saldana', 'role' => 'Lead'],
                    ['name' => 'Sigourney Weaver', 'role' => 'Support']
                ]),
                'director' => 'James Cameron',
                'status' => 'active',
            ],
            [
                'title' => 'Transformers: Rise of the Beasts',
                'synopsis' => 'During the \'90s, a new faction of Transformers - the Maximals - join the Autobots as allies in the battle for Earth. Optimus Prime and the Autobots are forced to form an alliance with the Maximals to defend Earth from a powerful new threat: the Terrorcons.',
                'duration' => 127,
                'genre' => json_encode(['Action', 'Adventure', 'Sci-Fi']),
                'language' => 'English',
                'age_rating' => 'PG-13',
                'release_date' => '2024-06-09',
                'poster_url' => 'https://picsum.photos/500/750?random=29',
                'trailer_url' => 'https://www.youtube.com/watch?v=9QngZfFU4SA',
                'cast' => json_encode([
                    ['name' => 'Anthony Ramos', 'role' => 'Lead'],
                    ['name' => 'Dominique Fishback', 'role' => 'Lead'],
                    ['name' => 'Peter Cullen', 'role' => 'Support']
                ]),
                'director' => 'Steven Caple Jr.',
                'status' => 'active',
            ],
        ];

        // Combine all movies
        $allMovies = array_merge($vietnameseMovies, $internationalMovies);

        // Create movies
        foreach ($allMovies as $movieData) {
            Movie::create($movieData);
        }

        $this->command->info('Created ' . count($allMovies) . ' sample movies.');
    }
}