//Prima applicazione React
// 1) import React and ReactDOM libraries
import React from 'react';
import ReactDOM from 'react-dom/client'; //specifico al sistema che sto sviluppando un'app specifica per il web (browser)
//In futuro vedremo come con poco sforzo possiamo usare React anche per sviluppare app per dispositivi mobili (React Native)

// 2) Get a reference to the div with ID 'root'
const el = document.getElementById('root');

// 3) Tell React to take control of that element
//React lavora su un DOM virtuale (una copia del DOM reale) per ottimizzare le operazioni di aggiornamento dell'interfaccia utente
//Per fare ciò, dobbiamo dire a React di prendere il controllo di un elemento specifico del DOM reale
//Potrebbe succedere che una operazione tocchi varie parti del DOM del browser, senza react questo richiederebbe molte operazioni di aggiornamento del DOM reale, che sono costose in termini di prestazioni
//React invece aggiorna il DOM virtuale e poi calcola la maniera più efficiente per aggiornare il DOM reale, minimizzando le operazioni necessarie
const root = ReactDOM.createRoot(el);

// 4) Create a component
//Componenti in React sono funzioni che ritornano del codice JSX (una sintassi simile a HTML ma con alcune differenze)
//Ogni componente è associata ad una parte di interfaccia utente (UI)
//I componenti in React devono sempre iniziare con la lettera maiuscola
function App() {
  return <h1>Hello, world!</h1>;
}

// 5) Show the component on the screen
//Inserisce tutto nel DOM virtuale e poi aggiorna il DOM reale in maniera efficiente
root.render(<App />);