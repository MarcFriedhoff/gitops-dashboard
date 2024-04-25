import { useState, useEffect } from 'react';

export const useConfig = () => {
    const [config, setConfig] = useState(null);

    useEffect(() => {
        fetch('/config')
            .then((res) => res.json())
            .then((fetchedConfig) => {
                setConfig(fetchedConfig);
            });
    }, []);

    return config;
};