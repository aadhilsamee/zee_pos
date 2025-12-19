import React, { useState, useEffect, useRef } from 'react';

const DraggableBubble = ({ children, initialPosition = { x: 20, y: 100 }, className = '' }) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const bubbleRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Optional: keep within bounds (leaving unlimited for now as requested "movable")
            setPosition({
                x: newX,
                y: newY
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e) => {
        // Prevent default to avoid selection
        // e.preventDefault(); // Don't prevent default, might block click events on children if not careful.
        // Actually, for a bubble that is also a button, we need to be careful.
        // We will separate drag handle logic or use a threshold.

        // For now, let's just start drag. Click events usually still fire on mouseup if no move.

        if (bubbleRef.current) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    // Prevent drag from blocking click
    // If we moved significantly, we should block the click event on children?
    // React events propagate.

    return (
        <div
            ref={bubbleRef}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 9999, // High z-index to sit on top of everything
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none' // For better touch support preparation
            }}
            onMouseDown={handleMouseDown}
            className={`transition-shadow ${isDragging ? 'shadow-2xl scale-105' : 'shadow-lg'} ${className}`}
        >
            {children}
        </div>
    );
};

export default DraggableBubble;
