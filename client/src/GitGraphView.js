import React, { useState } from 'react';
import { Gitgraph } from '@gitgraph/react';
import { ZoomIn, ZoomOut } from 'react-bootstrap-icons';

const GitGraphView = ({ commits }) => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => {
    setZoom(prevZoom => prevZoom + 0.1);
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => prevZoom - 0.1);
  };

  return (
    <div>
      <ZoomIn onClick={handleZoomIn}/>
      <ZoomOut onClick={handleZoomOut}/>
      <div style={{ transform: `scale(${zoom})` }}>
        <Gitgraph>
          {(gitgraph) => {
            gitgraph.import(commits);
          }}
        </Gitgraph>
      </div>
    </div>
  );
};

export default GitGraphView;