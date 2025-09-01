import { useState } from 'react'
import './Help.css'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "Làm thế nào để đặt vé xem phim?",
    answer: "Bạn có thể đặt vé trực tuyến qua website hoặc ứng dụng di động của chúng tôi. Chỉ cần chọn phim, suất chiếu, ghế ngồi và thanh toán.",
    category: "booking"
  },
  {
    id: 2,
    question: "Có thể hủy vé đã đặt không?",
    answer: "Có thể hủy vé trong vòng 2 giờ trước giờ chiếu. Vui lòng liên hệ hotline 1900 1234 để được hỗ trợ hủy vé.",
    category: "booking"
  },
  {
    id: 3,
    question: "Thanh toán qua những phương thức nào?",
    answer: "Chúng tôi hỗ trợ thanh toán qua thẻ tín dụng, ví điện tử (MoMo, ZaloPay), chuyển khoản ngân hàng và tiền mặt tại rạp.",
    category: "payment"
  },
  {
    id: 4,
    question: "Làm thế nào để nhận e-ticket?",
    answer: "Sau khi thanh toán thành công, e-ticket sẽ được gửi đến email của bạn. Bạn cũng có thể tải vé từ trang cá nhân.",
    category: "ticket"
  },
  {
    id: 5,
    question: "Có thể đổi suất chiếu không?",
    answer: "Có thể đổi suất chiếu trong vòng 24 giờ trước giờ chiếu. Phí đổi vé là 20,000 VND/lần.",
    category: "booking"
  },
  {
    id: 6,
    question: "Trẻ em có cần mua vé không?",
    answer: "Trẻ em dưới 3 tuổi không cần mua vé. Trẻ em từ 3-12 tuổi mua vé trẻ em với giá ưu đãi.",
    category: "ticket"
  },
  {
    id: 7,
    question: "Làm thế nào để tích điểm thành viên?",
    answer: "Mỗi 100,000 VND chi tiêu, bạn sẽ tích được 1 điểm. Điểm có thể dùng để giảm giá cho lần đặt vé tiếp theo.",
    category: "membership"
  },
  {
    id: 8,
    question: "Có thể đặt vé cho người khác không?",
    answer: "Có thể đặt vé cho người khác. Chỉ cần nhập thông tin người xem phim khi đặt vé.",
    category: "booking"
  }
]

const categories = [
  { id: 'all', name: 'Tất cả', icon: '📋' },
  { id: 'booking', name: 'Đặt vé', icon: '🎫' },
  { id: 'payment', name: 'Thanh toán', icon: '💳' },
  { id: 'ticket', name: 'Vé xem phim', icon: '🎬' },
  { id: 'membership', name: 'Thành viên', icon: '👥' }
]

export default function Help() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="help-page">
      <div className="help-hero">
        <div className="hero-content">
          <h1>Trung tâm hỗ trợ</h1>
          <p>Tìm câu trả lời cho các câu hỏi thường gặp và được hỗ trợ nhanh chóng</p>
        </div>
      </div>

      <div className="help-content">
        <div className="container">
          {/* Search Section */}
          <div className="search-section">
            <div className="search-box">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="categories-section">
            <h2>Danh mục hỗ trợ</h2>
            <div className="categories-grid">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="category-icon">{category.icon}</div>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h2>Câu hỏi thường gặp</h2>
            {filteredFAQs.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🤔</div>
                <h3>Không tìm thấy câu trả lời</h3>
                <p>Hãy thử tìm kiếm với từ khóa khác hoặc liên hệ với chúng tôi để được hỗ trợ.</p>
                <button className="contact-support-btn">
                  Liên hệ hỗ trợ
                </button>
              </div>
            ) : (
              <div className="faq-list">
                {filteredFAQs.map(faq => (
                  <div key={faq.id} className="faq-item">
                    <button
                      className="faq-question"
                      onClick={() => toggleExpanded(faq.id)}
                    >
                      <span className="question-text">{faq.question}</span>
                      <span className={`expand-icon ${expandedItems.includes(faq.id) ? 'expanded' : ''}`}>
                        {expandedItems.includes(faq.id) ? '−' : '+'}
                      </span>
                    </button>
                    {expandedItems.includes(faq.id) && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Hành động nhanh</h2>
            <div className="actions-grid">
              <div className="action-card">
                <div className="action-icon">📞</div>
                <h3>Gọi hotline</h3>
                <p>Liên hệ trực tiếp với nhân viên hỗ trợ</p>
                <button className="action-btn">1900 1234</button>
              </div>
              <div className="action-card">
                <div className="action-icon">💬</div>
                <h3>Chat trực tuyến</h3>
                <p>Nhận hỗ trợ tức thì qua chat</p>
                <button className="action-btn">Bắt đầu chat</button>
              </div>
              <div className="action-card">
                <div className="action-icon">📧</div>
                <h3>Gửi email</h3>
                <p>Gửi yêu cầu hỗ trợ qua email</p>
                <button className="action-btn">Gửi email</button>
              </div>
              <div className="action-card">
                <div className="action-icon">📱</div>
                <h3>Ứng dụng di động</h3>
                <p>Tải ứng dụng để trải nghiệm tốt hơn</p>
                <button className="action-btn">Tải ứng dụng</button>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="contact-support">
            <div className="support-content">
              <h2>Vẫn cần hỗ trợ?</h2>
              <p>Đội ngũ hỗ trợ khách hàng của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7</p>
              <div className="support-methods">
                <div className="support-method">
                  <div className="method-icon">📞</div>
                  <div className="method-info">
                    <h3>Hotline</h3>
                    <p>1900 1234</p>
                    <span className="method-note">Hỗ trợ 24/7</span>
                  </div>
                </div>
                <div className="support-method">
                  <div className="method-icon">📧</div>
                  <div className="method-info">
                    <h3>Email</h3>
                    <p>support@cinebook.vn</p>
                    <span className="method-note">Phản hồi trong 24h</span>
                  </div>
                </div>
                <div className="support-method">
                  <div className="method-icon">💬</div>
                  <div className="method-info">
                    <h3>Live Chat</h3>
                    <p>Chat trực tuyến</p>
                    <span className="method-note">Hỗ trợ tức thì</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 