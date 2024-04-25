import React from 'react';
import { Accordion, ListGroup } from 'react-bootstrap';
import { Badge } from 'react-bootstrap';

const Versions = ({ versions }) => (
    <div>
        <Accordion flush>
            {Object.entries(versions).map(([version, data]) => (
                <Accordion.Item >
                    <Accordion.Header>{version}</Accordion.Header>
                    <Accordion.Body>
                        {data.repositories.map((repositories) => (
                            <ListGroup>
                                    <ListGroup.Item
                                        className="d-flex justify-content-between align-items-start"
                                        >
                                        <div className="ms-2 me-auto">
                                            <div className="fw-bold">{repositories.name}</div>
                                        {repositories.pkgs.map((pkg) => (
                                            <div>- {pkg}</div>
                                        ))}
                                        </div>

                                        <Badge bg="primary" pill>
                                            {repositories.tag}
                                        </Badge>
                                    </ListGroup.Item>
                                </ListGroup>
                            ))}
                    </Accordion.Body>
                </Accordion.Item>
            ))}
        </Accordion>
    </div>
);

export default Versions;