import React from 'react';
import { Container } from 'react-bootstrap';
import axios from 'axios';
import { useEffect } from 'react';
import yaml from 'js-yaml';
import { Breadcrumb } from 'react-bootstrap';
import { House } from 'react-bootstrap-icons';

const GitOpsConfig = () => {

    const [config, setConfig] = React.useState({});

    useEffect(() => {
        const fetchConfig = async () => {
            const response = await axios.get('/config');
            setConfig(response.data);
        };

        fetchConfig();
    }, []);


    return (
        <Container>
            <nav class="navbar navbar-dark bg-dar justify-content-between">

                <Breadcrumb>
                    <Breadcrumb.Item href="/"><House /></Breadcrumb.Item>
                    <Breadcrumb.Item href="#" active>Config</Breadcrumb.Item>
                </Breadcrumb>
            </nav>
            <pre>{yaml.dump(config)}</pre>
        </Container>
    );
}

export default GitOpsConfig;
