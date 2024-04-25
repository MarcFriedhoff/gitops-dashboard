import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import GitRepos from './GitRepos';
import GitBranches from './GitBranches'; // Import the GitBranches component
import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useLocation } from 'react-router-dom';

const App = () => {

  return (

    <Router>
      <Navbar bg="primary" data-bs-theme="dark">

        <Container>
          <Navbar.Brand>GitOps Dashboard</Navbar.Brand>
          <Nav className="me-auto">
          <LinkContainer to="/">
            <Navbar.Brand>Home</Navbar.Brand>
          </LinkContainer>
          <LinkContainer to="/repos">
            <Nav.Link>Repos</Nav.Link>
          </LinkContainer>
          </Nav>
        </Container>
      </Navbar>
      <Container fluid>
        <Routes>
          <Route path="/repos" element={<GitRepos />} />
          <Route path="/repos/:repoName" element={<GitBranches />} />
          <Route path="/repos/:repoName/branches" element={<GitBranches />} />
          <Route path="/repos/:repoName/branches/:branch" element={<GitBranches />} />
          <Route path="/repos/:repoName/branches/:branch/files" element={<GitBranches />} />
          <Route path="/repos/:repoName/branches/:branch/files/:filePath" element={<GitBranches />} />
          <Route path="/" element={<GitRepos />} />
        </Routes>
      </Container>
    </Router >

  );
};

export default App;