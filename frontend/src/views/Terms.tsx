import { Link } from 'react-router-dom'
import './Terms.css'

export default function Terms() {
  return (
    <div className="terms-page">
      {/* Header */}
      <div className="terms-header">
        <div className="header-content">
          <h1>📜 Điều khoản sử dụng</h1>
          <p>Điều khoản và điều kiện sử dụng dịch vụ đặt vé xem phim CineBook</p>
        </div>
      </div>

      {/* Content */}
      <div className="terms-content">
        <div className="terms-container">
          <div className="terms-section">
            <h2>📋 Điều khoản chung</h2>
            <div className="section-content">
              <p>Bằng việc sử dụng dịch vụ CineBook, bạn đồng ý tuân thủ các điều khoản và điều kiện sau đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của chúng tôi.</p>
              
              <h3>Định nghĩa</h3>
              <ul>
                <li><strong>"CineBook"</strong> - Nền tảng đặt vé xem phim trực tuyến</li>
                <li><strong>"Người dùng"</strong> - Bất kỳ ai sử dụng dịch vụ CineBook</li>
                <li><strong>"Dịch vụ"</strong> - Tất cả các tính năng và chức năng của CineBook</li>
                <li><strong>"Nội dung"</strong> - Thông tin, hình ảnh, video trên website</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>🎫 Điều khoản đặt vé</h2>
            <div className="section-content">
              <h3>Quy trình đặt vé</h3>
              <ul>
                <li>Vé được đặt theo nguyên tắc "ai đến trước được phục vụ trước"</li>
                <li>Thanh toán phải được hoàn tất trong vòng 15 phút sau khi chọn ghế</li>
                <li>Vé đã thanh toán không thể hoàn tiền trừ khi có lỗi từ hệ thống</li>
                <li>Người dùng phải có mặt tại rạp ít nhất 15 phút trước giờ chiếu</li>
              </ul>

              <h3>Hủy và hoàn tiền</h3>
              <ul>
                <li>Vé có thể được hủy trước 2 giờ so với giờ chiếu</li>
                <li>Phí hủy vé: 10% giá trị vé</li>
                <li>Không hoàn tiền cho vé đã sử dụng hoặc bỏ lỡ</li>
                <li>Hoàn tiền sẽ được thực hiện trong vòng 3-5 ngày làm việc</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>👤 Tài khoản người dùng</h2>
            <div className="section-content">
              <h3>Đăng ký và bảo mật</h3>
              <ul>
                <li>Bạn phải cung cấp thông tin chính xác khi đăng ký</li>
                <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập</li>
                <li>Không được chia sẻ tài khoản với người khác</li>
                <li>Chúng tôi có quyền từ chối hoặc chấm dứt tài khoản vi phạm</li>
              </ul>

              <h3>Quyền và nghĩa vụ</h3>
              <ul>
                <li>Sử dụng dịch vụ theo đúng mục đích</li>
                <li>Không vi phạm quyền sở hữu trí tuệ</li>
                <li>Không gây quá tải hoặc làm gián đoạn hệ thống</li>
                <li>Báo cáo lỗi hoặc vấn đề bảo mật</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>💰 Thanh toán và giá cả</h2>
            <div className="section-content">
              <h3>Phương thức thanh toán</h3>
              <ul>
                <li>Thẻ tín dụng/ghi nợ (Visa, Mastercard)</li>
                <li>Ví điện tử (MoMo, ZaloPay, VNPay)</li>
                <li>Chuyển khoản ngân hàng</li>
                <li>Tiền mặt tại rạp (chỉ áp dụng cho đặt vé trực tiếp)</li>
              </ul>

              <h3>Giá cả và phí</h3>
              <ul>
                <li>Giá vé có thể thay đổi mà không báo trước</li>
                <li>Phí dịch vụ: 5,000 VNĐ/vé</li>
                <li>Phí giao dịch: Theo quy định của ngân hàng</li>
                <li>Tất cả giá đã bao gồm thuế VAT</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>🎬 Nội dung và bản quyền</h2>
            <div className="section-content">
              <h3>Sở hữu trí tuệ</h3>
              <ul>
                <li>Tất cả nội dung trên CineBook thuộc quyền sở hữu của chúng tôi</li>
                <li>Không được sao chép, phân phối nội dung mà không được phép</li>
                <li>Logo, thương hiệu CineBook được bảo vệ bản quyền</li>
                <li>Nội dung phim thuộc quyền sở hữu của các hãng phim</li>
              </ul>

              <h3>Sử dụng nội dung</h3>
              <ul>
                <li>Chỉ sử dụng cho mục đích cá nhân, phi thương mại</li>
                <li>Không được chỉnh sửa hoặc tạo tác phẩm phái sinh</li>
                <li>Phải ghi rõ nguồn khi trích dẫn</li>
                <li>Tuân thủ luật bản quyền Việt Nam</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>🚫 Hành vi bị cấm</h2>
            <div className="section-content">
              <p>Người dùng không được phép:</p>
              <ul>
                <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                <li>Gửi spam, quảng cáo không được phép</li>
                <li>Hack, tấn công hoặc làm gián đoạn hệ thống</li>
                <li>Đăng nội dung xúc phạm, bạo lực, khiêu dâm</li>
                <li>Giả mạo danh tính hoặc thông tin cá nhân</li>
                <li>Buôn bán hoặc chuyển nhượng tài khoản</li>
                <li>Sử dụng bot hoặc script tự động</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>⚖️ Trách nhiệm pháp lý</h2>
            <div className="section-content">
              <h3>Giới hạn trách nhiệm</h3>
              <ul>
                <li>CineBook không chịu trách nhiệm về nội dung phim</li>
                <li>Không bảo đảm dịch vụ luôn hoạt động liên tục</li>
                <li>Không chịu trách nhiệm về thiệt hại gián tiếp</li>
                <li>Trách nhiệm tối đa: Giá trị vé đã mua</li>
              </ul>

              <h3>Bồi thường</h3>
              <ul>
                <li>Người dùng phải bồi thường thiệt hại do vi phạm</li>
                <li>Chúng tôi có quyền khởi kiện nếu cần thiết</li>
                <li>Tuân thủ luật pháp Việt Nam</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>🔄 Thay đổi điều khoản</h2>
            <div className="section-content">
              <p>Chúng tôi có quyền thay đổi điều khoản này bất cứ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi được coi là chấp nhận điều khoản mới.</p>
              
              <h3>Thông báo thay đổi</h3>
              <ul>
                <li>Thông báo qua email đăng ký</li>
                <li>Đăng tải trên website</li>
                <li>Thông báo trong ứng dụng</li>
                <li>Thời gian hiệu lực: Ngay sau khi đăng tải</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>📞 Liên hệ và giải quyết tranh chấp</h2>
            <div className="section-content">
              <h3>Thông tin liên hệ</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <strong>Email:</strong> legal@cinebook.com
                </div>
                <div className="contact-item">
                  <strong>Điện thoại:</strong> 1900-xxxx
                </div>
                <div className="contact-item">
                  <strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM
                </div>
              </div>

              <h3>Giải quyết tranh chấp</h3>
              <ul>
                <li>Ưu tiên giải quyết thông qua thương lượng</li>
                <li>Trọng tài thương mại nếu không thể thương lượng</li>
                <li>Tòa án có thẩm quyền tại TP.HCM</li>
                <li>Áp dụng luật pháp Việt Nam</li>
              </ul>
            </div>
          </div>

          <div className="terms-section">
            <h2>📅 Hiệu lực</h2>
            <div className="section-content">
              <p>Điều khoản này có hiệu lực từ ngày 30/08/2024 và thay thế tất cả các điều khoản trước đó.</p>
              <p><strong>Cập nhật lần cuối:</strong> 30/08/2024</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="terms-navigation">
            <Link to="/privacy" className="btn btn-secondary">
              Chính sách bảo mật
            </Link>
            <Link to="/contact" className="btn btn-primary">
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 