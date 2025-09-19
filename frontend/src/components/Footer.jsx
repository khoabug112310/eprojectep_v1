import React from 'react';
import { Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './MainLayout.css'; // Import the CSS file

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <div className="row">
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="text-gold">CineBook</h5>
            <p>Your ultimate cinema experience</p>
          </div>
          <div className="col-md-4 mb-4 mb-md-0">
            <h5>Navigation</h5>
            <ul className="list-unstyled">
              <li><Nav.Link as={Link} to="/" className="text-light p-0">Home</Nav.Link></li>
              <li><Nav.Link as={Link} to="/movies" className="text-light p-0">All Movies</Nav.Link></li>
              <li><Nav.Link as={Link} to="/theaters" className="text-light p-0">All Theaters</Nav.Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Contact</h5>
            <p>Email: info@cinebook.com</p>
            <p>Phone: +1 (555) 123-4567</p>
          </div>
        </div>
        <hr className="my-4" />
        <div className="text-center">
          <p>&copy; 2025 CineBook. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;