import React from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';

const HomeFooter = () => {
  return (
    <>

      {/* Testimonials Section */}
      <section className="py-5 bg-dark">
        <Container>
          <h2 className="text-gold text-center mb-5">What Our Customers Say</h2>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-secondary">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="text-gold">JD</span>
                    </div>
                    <div>
                      <h5 className="text-white mb-0">John Doe</h5>
                      <div className="text-gold">
                        {'★'.repeat(5)}
                      </div>
                    </div>
                  </div>
                  <Card.Text className="text-gray">
                    "The booking process was so smooth and easy. I love the seat selection feature!"
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-secondary">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="text-gold">MS</span>
                    </div>
                    <div>
                      <h5 className="text-white mb-0">Mary Smith</h5>
                      <div className="text-gold">
                        {'★'.repeat(4)}
                      </div>
                    </div>
                  </div>
                  <Card.Text className="text-gray">
                    "Great movie selection and the theaters are always clean and comfortable."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-secondary">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="text-gold">RP</span>
                    </div>
                    <div>
                      <h5 className="text-white mb-0">Robert Park</h5>
                      <div className="text-gold">
                        {'★'.repeat(5)}
                      </div>
                    </div>
                  </div>
                  <Card.Text className="text-gray">
                    "The early bird discount saved me money and the staff were very helpful."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default HomeFooter;