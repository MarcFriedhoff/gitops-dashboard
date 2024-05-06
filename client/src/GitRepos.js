import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Row, Col, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useConfig } from './UseConfig.js';
import { Git } from 'react-bootstrap-icons';


const GitRepos = () => {
    const config = useConfig();
    const [repos, setRepos] = useState([]);
    const [filter, setFilter] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRepos = async () => {
            const response = await axios.get('/repos');
            setRepos(response.data);
        };

        fetchRepos();
    }, []);

    return (
        <Container>
            <nav class="navbar navbar-dark bg-dar justify-content-between">
                <Form.Control
                    type="text"
                    placeholder="Filter repositories"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </nav>
            <Row>
                {repos.filter(repo => repo.name.includes(filter)).map((repo, index) => (
                    <Card onClick={() => navigate(`/repos/${repo.name}`)} style={{ width: '18rem', margin: '8px 16px' }}>
                        <Card.Body>
                            <Card.Title><Git/> {repo.name} </Card.Title>
                            <Card.Text>{repo.description}</Card.Text>
                        </Card.Body>
                    </Card>
                ))}
            </Row>
        </Container>
    );
};

export default GitRepos;