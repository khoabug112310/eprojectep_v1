import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="hero-content">
          <h1>Về CineBook</h1>
          <p>Hệ thống đặt vé xem phim trực tuyến hàng đầu Việt Nam</p>
        </div>
      </div>

      <div className="about-content">
        <div className="container">
          {/* Company Story */}
          <section className="company-story">
            <h2>Câu chuyện của chúng tôi</h2>
            <div className="story-content">
              <div className="story-text">
                <p>
                  CineBook được thành lập với mục tiêu mang đến trải nghiệm đặt vé xem phim 
                  thuận tiện và hiện đại nhất cho người dân Việt Nam. Chúng tôi tin rằng 
                  việc xem phim không chỉ là giải trí mà còn là một trải nghiệm văn hóa 
                  quan trọng trong cuộc sống.
                </p>
                <p>
                  Từ những ngày đầu tiên, chúng tôi đã tập trung vào việc tạo ra một 
                  nền tảng công nghệ tiên tiến, kết hợp với dịch vụ khách hàng xuất sắc 
                  để mang đến trải nghiệm tốt nhất cho người dùng.
                </p>
              </div>
              <div className="story-stats">
                <div className="stat-item">
                  <div className="stat-number">1M+</div>
                  <div className="stat-label">Người dùng</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50+</div>
                  <div className="stat-label">Rạp chiếu</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">Suất chiếu/ngày</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
              </div>
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="mission-vision">
            <div className="mission">
              <h3>🎯 Sứ mệnh</h3>
              <p>
                Mang đến trải nghiệm đặt vé xem phim thuận tiện, nhanh chóng và 
                an toàn cho mọi người dân Việt Nam, góp phần phát triển văn hóa 
                giải trí trong nước.
              </p>
            </div>
            <div className="vision">
              <h3>👁️ Tầm nhìn</h3>
              <p>
                Trở thành nền tảng đặt vé xem phim số 1 tại Việt Nam, tiên phong 
                trong việc ứng dụng công nghệ mới để nâng cao trải nghiệm người dùng.
              </p>
            </div>
          </section>

          {/* Values */}
          <section className="values">
            <h2>Giá trị cốt lõi</h2>
            <div className="values-grid">
              <div className="value-item">
                <div className="value-icon">🚀</div>
                <h3>Đổi mới</h3>
                <p>Không ngừng cải tiến và áp dụng công nghệ mới để mang đến trải nghiệm tốt nhất</p>
              </div>
              <div className="value-item">
                <div className="value-icon">🤝</div>
                <h3>Tin cậy</h3>
                <p>Xây dựng niềm tin với khách hàng thông qua dịch vụ chất lượng và minh bạch</p>
              </div>
              <div className="value-item">
                <div className="value-icon">❤️</div>
                <h3>Khách hàng</h3>
                <p>Đặt khách hàng làm trung tâm trong mọi quyết định và hoạt động</p>
              </div>
              <div className="value-item">
                <div className="value-icon">🌟</div>
                <h3>Chất lượng</h3>
                <p>Cam kết cung cấp dịch vụ chất lượng cao nhất trong mọi tương tác</p>
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="team">
            <h2>Đội ngũ của chúng tôi</h2>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-avatar">👨‍💼</div>
                <h3>Nguyễn Văn A</h3>
                <p className="member-role">CEO & Founder</p>
                <p className="member-desc">
                  Với hơn 10 năm kinh nghiệm trong lĩnh vực công nghệ và giải trí
                </p>
              </div>
              <div className="team-member">
                <div className="member-avatar">👩‍💻</div>
                <h3>Trần Thị B</h3>
                <p className="member-role">CTO</p>
                <p className="member-desc">
                  Chuyên gia về phát triển phần mềm và kiến trúc hệ thống
                </p>
              </div>
              <div className="team-member">
                <div className="member-avatar">👨‍🎨</div>
                <h3>Lê Văn C</h3>
                <p className="member-role">Head of Design</p>
                <p className="member-desc">
                  Tạo ra những trải nghiệm người dùng tuyệt vời và trực quan
                </p>
              </div>
              <div className="team-member">
                <div className="member-avatar">👩‍💼</div>
                <h3>Phạm Thị D</h3>
                <p className="member-role">Head of Operations</p>
                <p className="member-desc">
                  Đảm bảo hoạt động mượt mà và dịch vụ khách hàng xuất sắc
                </p>
              </div>
            </div>
          </section>

          {/* Technology */}
          <section className="technology">
            <h2>Công nghệ</h2>
            <div className="tech-content">
              <div className="tech-text">
                <p>
                  CineBook được xây dựng trên nền tảng công nghệ hiện đại nhất, 
                  đảm bảo hiệu suất cao, bảo mật tốt và trải nghiệm người dùng mượt mà.
                </p>
              </div>
              <div className="tech-stack">
                <div className="tech-category">
                  <h3>Frontend</h3>
                  <div className="tech-items">
                    <span className="tech-item">React 18</span>
                    <span className="tech-item">TypeScript</span>
                    <span className="tech-item">Vite</span>
                    <span className="tech-item">Tailwind CSS</span>
                  </div>
                </div>
                <div className="tech-category">
                  <h3>Backend</h3>
                  <div className="tech-items">
                    <span className="tech-item">Laravel 10</span>
                    <span className="tech-item">PHP 8.1+</span>
                    <span className="tech-item">MySQL</span>
                    <span className="tech-item">Redis</span>
                  </div>
                </div>
                <div className="tech-category">
                  <h3>Infrastructure</h3>
                  <div className="tech-items">
                    <span className="tech-item">AWS</span>
                    <span className="tech-item">Docker</span>
                    <span className="tech-item">CI/CD</span>
                    <span className="tech-item">CDN</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="contact-section">
            <h2>Liên hệ với chúng tôi</h2>
            <div className="contact-content">
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">🏢</div>
                  <div className="contact-details">
                    <h4>Địa chỉ</h4>
                    <p>123 Đường ABC, Quận 1, TP.HCM</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <div className="contact-details">
                    <h4>Điện thoại</h4>
                    <p>1900 1234</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">📧</div>
                  <div className="contact-details">
                    <h4>Email</h4>
                    <p>info@cinebook.vn</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">🌐</div>
                  <div className="contact-details">
                    <h4>Website</h4>
                    <p>www.cinebook.vn</p>
                  </div>
                </div>
              </div>
              <div className="contact-form">
                <h3>Gửi tin nhắn cho chúng tôi</h3>
                <form className="contact-form-content">
                  <div className="form-group">
                    <input type="text" placeholder="Họ và tên" required />
                  </div>
                  <div className="form-group">
                    <input type="email" placeholder="Email" required />
                  </div>
                  <div className="form-group">
                    <input type="text" placeholder="Tiêu đề" required />
                  </div>
                  <div className="form-group">
                    <textarea placeholder="Nội dung tin nhắn" rows={5} required></textarea>
                  </div>
                  <button type="submit" className="submit-btn">
                    Gửi tin nhắn
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 