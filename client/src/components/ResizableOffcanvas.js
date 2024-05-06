import React, { useState, useRef, useEffect } from 'react';
import { Offcanvas } from 'react-bootstrap';

const ResizableOffcanvas = ({ show, onHide, children, defaultWidth = 500, ...props }) => {
  const [width, setWidth] = useState(defaultWidth);
  const handleRef = useRef(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    console.log('useEffect');
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newWidth = document.body.offsetWidth - e.clientX;
      if (newWidth > 100) { // Set minimum width to 100px
        setWidth(newWidth);
      }
    };

    const handleMouseDown = (e) => {
      console.log('mousedown');
      isResizingRef.current = true;
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    if (handleRef.current) {
      console.log('add event listener');
      handleRef.current.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (handleRef.current) {
        handleRef.current.removeEventListener('mousedown', handleMouseDown);
      }      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleRef.current]);

  return (
    <Offcanvas show={show} onHide={onHide} {...props} style={{ width }}>
      {children}
      <div ref={handleRef} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '5px', cursor: 'col-resize' }} />
    </Offcanvas>
  );
};

export default ResizableOffcanvas;