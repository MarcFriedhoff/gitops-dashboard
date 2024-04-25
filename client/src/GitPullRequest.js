// create a modal dialog that creates a new pull request for the selected branch from a release branch

import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

import axios from 'axios';

const GitPullRequest = ({ show, handleClose, repoName, branch, prUrl }) => {
    const [sourceBranch, setSourceBranch] = useState('');
    const [description, setDescription] = useState('');
    const [title, setTitle] = useState('');
    const [sourceBranches, setSourceBranches] = useState([]);

    function createPullRequest () {
        // replace branch, title, and description with the correct values in prURL
        prUrl = prUrl.replace('{repo}', repoName);
        prUrl = prUrl.replace('{base}', encodeURIComponent(sourceBranch.replace('origin/','')));
        prUrl = prUrl.replace('{compare}', encodeURIComponent(branch.replace('origin/','')));
        prUrl = prUrl.replace('{title}', encodeURIComponent(title));
        prUrl = prUrl.replace('{description}', encodeURIComponent(description));
        
        console.log(prUrl);
        var win = window.open(prUrl, '_blank');
        win.focus();
    }

    useEffect(() => {
        const fetchSourceBranches = async () => {
            const response = await axios.get(`/repos/${repoName}/branches`);
            setSourceBranches(Object.keys(response.data));
        };

        fetchSourceBranches();
    }, [repoName]);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create Pull Request</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3" controlId="sourceBranch">
                        <Form.Label>Source Branch</Form.Label>
                        <Form.Select value={sourceBranch} onChange={e => setSourceBranch(e.target.value)}>
                            {sourceBranches.map((branch, index) => (
                                <option key={index}>{branch}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="title">
                        <Form.Label>Title</Form.Label>
                        <Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} />   
                    </Form.Group>                    
                    <Form.Group className="mb-3" controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" value={description} onChange={e => setDescription(e.target.value)} />   
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button 
                    variant="secondary" 
                    onClick={handleClose}>
                    Close</Button>
                    <Button variant='primary' onClick={createPullRequest}>Create Pull Request</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default GitPullRequest;