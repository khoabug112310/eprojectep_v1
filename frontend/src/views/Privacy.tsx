import { Link } from 'react-router-dom'
import './Privacy.css'

export default function Privacy() {
  return (
    <div className="privacy-page">
      {/* Header */}
      <div className="privacy-header">
        <div className="header-content">
          <h1>🔒 Chính sách bảo mật</h1>
          <p>Thông tin về cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn</p>
        </div>
      </div>

      {/* Content */}
      <div className="privacy-content">
        <div className="privacy-container">
          <div className="privacy-section">
            <h2>📋 Thông tin chúng tôi thu thập</h2>
            <div className="section-content">
              <h3>Thông tin cá nhân</h3>
              <p>Chúng tôi thu thập thông tin cá nhân khi bạn:</p>
              <ul>
                <li>Đăng ký tài khoản (tên, email, số điện thoại)</li>
                <li>Đặt vé xem phim (thông tin thanh toán, lịch sử đặt vé)</li>
                <li>Liên hệ với chúng tôi (nội dung tin nhắn)</li>
                <li>Tham gia khảo sát hoặc chương trình khuyến mãi</li>
              </ul>

              <h3>Thông tin tự động</h3>
              <p>Chúng tôi cũng thu thập thông tin khi bạn sử dụng website:</p>
              <ul>
                <li>Địa chỉ IP và thông tin thiết bị</li>
                <li>Trang web bạn truy cập và thời gian truy cập</li>
                <li>Thông tin trình duyệt và hệ điều hành</li>
                <li>Cookies và công nghệ theo dõi tương tự</li>
              </ul>
            </div>
          </div>

          <div className="privacy-section">
            <h2>🎯 Cách chúng tôi sử dụng thông tin</h2>
            <div className="section-content">
              <p>Chúng tôi sử dụng thông tin của bạn để:</p>
              <ul>
                <li>Xử lý và xác nhận đặt vé của bạn</li>
                <li>Gửi thông báo về suất chiếu và khuyến mãi</li>
                <li>Cải thiện dịch vụ và trải nghiệm người dùng</li>
                <li>Phân tích xu hướng và thống kê sử dụng</li>
                <li>Bảo mật và ngăn chặn gian lận</li>
                <li>Tuân thủ các yêu cầu pháp lý</li>
              </ul>
            </div>
          </div>

          <div className="privacy-section">
            <h2>🤝 Chia sẻ thông tin</h2>
            <div className="section-content">
              <p>Chúng tôi có thể chia sẻ thông tin của bạn với:</p>
              <ul>
                <li><strong>Đối tác thanh toán:</strong> Để xử lý giao dịch</li>
                <li><strong>Rạp chiếu phim:</strong> Để xác nhận đặt vé</li>
                <li><strong>Nhà cung cấp dịch vụ:</strong> Để hỗ trợ hoạt động</li>
                <li><strong>Cơ quan pháp luật:</strong> Khi có yêu cầu hợp pháp</li>
              </ul>
              <p>Chúng tôi không bán, cho thuê hoặc trao đổi thông tin cá nhân của bạn với bên thứ ba vì mục đích tiếp thị.</p>
            </div>
          </div>

          <div className="privacy-section">
            <h2>🔐 Bảo mật thông tin</h2>
            <div className="section-content">
              <p>Chúng tôi thực hiện các biện pháp bảo mật để bảo vệ thông tin của bạn:</p>
              <ul>
                <li>Mã hóa SSL cho tất cả dữ liệu truyền tải</li>
                <li>Bảo mật cơ sở dữ liệu với firewall</li>
                <li>Kiểm soát truy cập nghiêm ngặt</li>
                <li>Giám sát bảo mật 24/7</li>
                <li>Đào tạo nhân viên về bảo mật</li>
              </ul>
            </div>
          </div>

          <div className="privacy-section">
            <h2>🍪 Cookies và công nghệ theo dõi</h2>
            <div className="section-content">
              <p>Chúng tôi sử dụng cookies để:</p>
              <ul>
                <li>Ghi nhớ tùy chọn và cài đặt của bạn</li>
                <li>Phân tích lưu lượng truy cập</li>
                <li>Cải thiện hiệu suất website</li>
                <li>Cung cấp nội dung phù hợp</li>
              </ul>
              <p>Bạn có thể kiểm soát cookies thông qua cài đặt trình duyệt.</p>
            </div>
          </div>

          <div className="privacy-section">
            <h2>👤 Quyền của bạn</h2>
            <div className="section-content">
              <p>Bạn có quyền:</p>
              <ul>
                <li>Truy cập và cập nhật thông tin cá nhân</li>
                <li>Yêu cầu xóa thông tin cá nhân</li>
                <li>Từ chối nhận email marketing</li>
                <li>Yêu cầu giải thích về việc sử dụng dữ liệu</li>
                <li>Khiếu nại với cơ quan bảo vệ dữ liệu</li>
              </ul>
            </div>
          </div>

          <div className="privacy-section">
            <h2>📧 Liên hệ</h2>
            <div className="section-content">
              <p>Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ:</p>
              <div className="contact-info">
                <div className="contact-item">
                  <strong>Email:</strong> privacy@cinebook.com
                </div>
                <div className="contact-item">
                  <strong>Điện thoại:</strong> 1900-xxxx
                </div>
                <div className="contact-item">
                  <strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM
                </div>
              </div>
            </div>
          </div>

          <div className="privacy-section">
            <h2>📅 Cập nhật chính sách</h2>
            <div className="section-content">
              <p>Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Những thay đổi sẽ được thông báo trên website và qua email.</p>
              <p><strong>Cập nhật lần cuối:</strong> 30/08/2024</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="privacy-navigation">
            <Link to="/contact" className="btn btn-secondary">
              Liên hệ hỗ trợ
            </Link>
            <Link to="/help" className="btn btn-primary">
              Trung tâm trợ giúp
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 