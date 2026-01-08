import ReactDOM from 'react-dom';

function Modal({ onClose, children, actionBar }){
    return ReactDOM.createPortal(
        <div>
            <div 
                onClick={onClose}
                className="absolute inset-0 bg-gray-500 opacity-75"
            >
            </div>
            <div className="absolute inset-40 p-10 bg-white">
                <div className="flex flex-col justify-between h-full">
                    {children}
                    <div className="flex justify-end">{actionBar}</div>
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