// modal dialog for creating a new tag
import React, { useState } from 'react';

import { Modal, Button, Form } from 'react-bootstrap';

import axios from 'axios';

const GitTag = ({ show, handleClose, repoName, branch }) => {
    
        const [tagName, setTagName] = useState('');
    
        const createTag = async () => {
    
            await axios.post(`/repos/${repoName}/tag`, { branch, tagName });
    
            handleClose();
    
        };
    
        return (
    
            <Modal show={show} onHide={handleClose}>
    
                <Modal.Header closeButton>
    
                    <Modal.Title>Create Tag</Modal.Title>
    
                </Modal.Header>
    
                <Modal.Body>
    
                    <Form>
    
                        <Form.Group className="mb-3" controlId="tagName">
    
                            <Form.Label>Tag Name</Form.Label>
    
                            <Form.Control type="text" placeholder="<major>.<minor>.<maint>-rc[0-9*]-sc[0-9]" value={tagName} onChange={e => setTagName(e.target.value)} />
                            <Form.Control.Feedback tooltip>Looks good!</Form.Control.Feedback>

                        </Form.Group>
    
                    </Form>
    
                </Modal.Body>
    
                <Modal.Footer>
    
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
    
                    <Button variant="primary" onClick={createTag}>Create Tag</Button>
    
                </Modal.Footer>
    
            </Modal>
    
        );
    
    };

export default GitTag;