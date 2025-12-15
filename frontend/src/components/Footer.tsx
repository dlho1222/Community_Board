import React from 'react';
import { Container } from 'react-bootstrap';

const Footer: React.FC = () => {
  return (
    <footer className="mt-5 p-3 bg-light text-center">
      <Container>
        <p>&copy; {new Date().getFullYear()} Community Board. All Rights Reserved.</p>
      </Container>
    </footer>
  );
};

export default Footer;
