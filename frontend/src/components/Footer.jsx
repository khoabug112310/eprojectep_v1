import React from 'react';
import { Container, Nav, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './MainLayout.css'; // Import the CSS file

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-5 mt-auto">
      <Container>
        <Row>
          {/* Company Info */}
          <Col lg={3} md={6} className="mb-4">
            <div className="footer-section">
              <h5 className="text-gold mb-3">
                <img 
                  src="./image/Gemini_Generated_Image_a55g0ka55g0ka55g.png" 
                  alt="CineBook" 
                  width="120" 
                  height="60" 
                  className="d-inline-block align-top me-2" 
                />
              </h5>
              <p className="mb-3">Your ultimate cinema experience with the latest movies and premium theaters across Vietnam.</p>
              <div className="social-media">
                <h6 className="text-gold mb-2">Follow Us</h6>
                <div className="d-flex gap-2">
                  <a href="#" className="text-light" aria-label="Facebook">
                    <i className="bi bi-facebook fs-4"></i>
                  </a>
                  <a href="#" className="text-light" aria-label="Instagram">
                    <i className="bi bi-instagram fs-4"></i>
                  </a>
                  <a href="#" className="text-light" aria-label="Twitter">
                    <i className="bi bi-twitter fs-4"></i>
                  </a>
                  <a href="#" className="text-light" aria-label="YouTube">
                    <i className="bi bi-youtube fs-4"></i>
                  </a>
                </div>
              </div>
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} md={6} className="mb-4">
            <div className="footer-section">
              <h5 className="text-gold mb-3">Quick Links</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Nav.Link as={Link} to="/" className="text-light p-0 footer-link">
                    <i className="bi bi-house me-2"></i>Home
                  </Nav.Link>
                </li>
                <li className="mb-2">
                  <Nav.Link as={Link} to="/movies" className="text-light p-0 footer-link">
                    <i className="bi bi-film me-2"></i>Movies
                  </Nav.Link>
                </li>
                <li className="mb-2">
                  <Nav.Link as={Link} to="/theaters" className="text-light p-0 footer-link">
                    <i className="bi bi-geo-alt me-2"></i>Theaters
                  </Nav.Link>
                </li>
                <li className="mb-2">
                  <Nav.Link as={Link} to="/movies?status=now-showing" className="text-light p-0 footer-link">
                    <i className="bi bi-play-circle me-2"></i>Now Showing
                  </Nav.Link>
                </li>
                <li className="mb-2">
                  <Nav.Link as={Link} to="/movies?status=coming-soon" className="text-light p-0 footer-link">
                    <i className="bi bi-calendar-event me-2"></i>Coming Soon
                  </Nav.Link>
                </li>
              </ul>
            </div>
          </Col>

          {/* Customer Service */}
          <Col lg={2} md={6} className="mb-4">
            <div className="footer-section">
              <h5 className="text-gold mb-3">Customer Service</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="#" className="text-light footer-link text-decoration-none">
                    <i className="bi bi-question-circle me-2"></i>Help & FAQ
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-light footer-link text-decoration-none">
                    <i className="bi bi-shield-check me-2"></i>Privacy Policy
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-light footer-link text-decoration-none">
                    <i className="bi bi-file-text me-2"></i>Terms of Service
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-light footer-link text-decoration-none">
                    <i className="bi bi-credit-card me-2"></i>Payment Methods
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-light footer-link text-decoration-none">
                    <i className="bi bi-arrow-clockwise me-2"></i>Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </Col>

          {/* Contact Info */}
          <Col lg={2} md={6} className="mb-4">
            <div className="footer-section">
              <h5 className="text-gold mb-3">Contact Info</h5>
              <div className="contact-info">
                <div className="mb-3">
                  <i className="bi bi-geo-alt-fill text-gold me-2"></i>
                  <span>123 Cinema Street<br />District 1, Ho Chi Minh City<br />Vietnam</span>
                </div>
                <div className="mb-3">
                  <i className="bi bi-telephone-fill text-gold me-2"></i>
                  <a href="tel:+84123456789" className="text-light text-decoration-none">
                    +84 123 456 789
                  </a>
                </div>
                <div className="mb-3">
                  <i className="bi bi-envelope-fill text-gold me-2"></i>
                  <a href="mailto:info@cinebook.vn" className="text-light text-decoration-none">
                    info@cinebook.vn
                  </a>
                </div>
                <div className="mb-3">
                  <i className="bi bi-clock-fill text-gold me-2"></i>
                  <span>Daily: 8:00 AM - 11:00 PM</span>
                </div>
              </div>
            </div>
          </Col>

          {/* Google Maps */}
          <Col lg={3} md={12} className="mb-4">
            <div className="footer-section">
              <h5 className="text-gold mb-3">Find Us</h5>
              <div className="map-container" style={{ height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4963567131963!2d106.69314631533428!3d10.772461862148482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40a3b49e59%3A0xa1bd14e483a602db!2sBen%20Thanh%20Market!5e0!3m2!1sen!2s!4v1695801234567!5m2!1sen!2s"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="CineBook Location"
                ></iframe>
              </div>
              <div className="mt-2">
                <a 
                  href="https://maps.google.com/?q=Ben+Thanh+Market,+Ho+Chi+Minh+City" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gold text-decoration-none small"
                >
                  <i className="bi bi-arrow-up-right-square me-1"></i>
                  Open in Google Maps
                </a>
              </div>
            </div>
          </Col>
        </Row>

        {/* Divider */}
        <hr className="my-4 border-secondary" />

        {/* Bottom Section */}
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start">
            <p className="mb-2 mb-md-0">&copy; 2025 CineBook Vietnam. All rights reserved.</p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <div className="payment-methods">
              <span className="me-3 small text-muted">We Accept:</span>
              <i className="bi bi-credit-card-2-front me-2 text-gold"></i>
              <i className="bi bi-paypal me-2 text-gold"></i>
              <span className="small text-muted">Visa, MasterCard, PayPal</span>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Custom Styles */}
      <style jsx>{`
        .footer-link:hover {
          color: #ffd700 !important;
          transition: color 0.3s ease;
        }
        
        .social-media a:hover {
          color: #ffd700 !important;
          transform: scale(1.1);
          transition: all 0.3s ease;
        }
        
        .contact-info a:hover {
          color: #ffd700 !important;
        }
        
        .map-container {
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .footer-section h5 {
          border-bottom: 2px solid #ffd700;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
      `}</style>
    </footer>
  );
};

export default Footer;