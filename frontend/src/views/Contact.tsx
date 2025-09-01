import { useState } from 'react'
import './Contact.css'

interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

export default function Contact() {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
    }, 2000)
  }

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="hero-content">
          <h1>Liên hệ với chúng tôi</h1>
          <p>Chúng tôi luôn sẵn sàng hỗ trợ và lắng nghe ý kiến của bạn</p>
        </div>
      </div>

      <div className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Information */}
            <div className="contact-info-section">
              <h2>Thông tin liên hệ</h2>
              <p className="section-description">
                Hãy liên hệ với chúng tôi qua các kênh sau để được hỗ trợ nhanh chóng
              </p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📞</div>
                  <div className="method-content">
                    <h3>Điện thoại</h3>
                    <p className="method-value">1900 1234</p>
                    <p className="method-description">Hỗ trợ 24/7</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <div className="method-content">
                    <h3>Email</h3>
                    <p className="method-value">support@cinebook.vn</p>
                    <p className="method-description">Phản hồi trong 24h</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">💬</div>
                  <div className="method-content">
                    <h3>Chat trực tuyến</h3>
                    <p className="method-value">Live Chat</p>
                    <p className="method-description">Hỗ trợ tức thì</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">🏢</div>
                  <div className="method-content">
                    <h3>Văn phòng</h3>
                    <p className="method-value">123 Đường ABC, Quận 1, TP.HCM</p>
                    <p className="method-description">Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="faq-section">
                <h3>Câu hỏi thường gặp</h3>
                <div className="faq-list">
                  <div className="faq-item">
                    <h4>Làm thế nào để đặt vé?</h4>
                    <p>Bạn có thể đặt vé trực tuyến qua website hoặc ứng dụng di động của chúng tôi.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Có thể hủy vé đã đặt không?</h4>
                    <p>Có thể hủy vé trong vòng 2 giờ trước giờ chiếu. Vui lòng liên hệ hotline để được hỗ trợ.</p>
                  </div>
                  <div className="faq-item">
                    <h4>Thanh toán qua những phương thức nào?</h4>
                    <p>Chúng tôi hỗ trợ thanh toán qua thẻ tín dụng, ví điện tử và chuyển khoản ngân hàng.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Gửi tin nhắn</h2>
              <p className="section-description">
                Điền thông tin bên dưới và chúng tôi sẽ liên hệ lại với bạn sớm nhất
              </p>

              {submitted ? (
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <h3>Cảm ơn bạn!</h3>
                  <p>Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="send-another-btn"
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="name">Họ và tên *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Nhập họ và tên của bạn"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Nhập địa chỉ email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Tiêu đề *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="Nhập tiêu đề tin nhắn"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Nội dung *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Nhập nội dung tin nhắn của bạn..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div className="map-section">
            <h2>Vị trí của chúng tôi</h2>
            <div className="map-container">
              <div className="map-placeholder">
                <div className="map-content">
                  <div className="map-icon">🗺️</div>
                  <h3>Bản đồ</h3>
                  <p>123 Đường ABC, Quận 1, TP.HCM</p>
                  <p>Việt Nam</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 