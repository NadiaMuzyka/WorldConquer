

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

function Modal({ onClose, children, actionBar }) {
    const modalRef = useRef(null);

    // ESC per chiudere
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Click fuori dal modal
    const handleOverlayClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backdropFilter: 'blur(2px)' }}
            onMouseDown={handleOverlayClick}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-60" />
            {/* Modal */}
            <div
                ref={modalRef}
                className="relative z-10 max-w-sm w-full rounded-2xl shadow-2xl bg-[#232A31] text-white p-7"
                style={{ minHeight: '120px' }}
                onMouseDown={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center justify-between">
                    {children}
                    <div className="flex flex-row justify-end w-full gap-2 mt-6">{actionBar}</div>
                </div>
            </div>
        </div>,
        document.querySelector('.modal-container')
    );
}

export default Modal;

// L'actionbar va fatta in base a come la vuoi tu ogni volta che usi il modal
/*
    const actionBar = (
        <div>
            <Button onClick={onSubmit}>
                Submit
            </Button>
        </div>
    );



    Il contenuto del modal va messo come figli del componente Modal
    <Modal onClose={closeModal} actionBar={actionBar}>
        <div>Modal Content</div>
    </Modal>
*/ 