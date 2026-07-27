'use client';
import { useState } from 'react';

export default function Home() {
  const [resultado, setResultado] = useState(null);
  const [archivo, setArchivo] = useState<File | null>(null);

  const subirArchivo = async () => {
    if (!archivo) {
      alert('Por favor, selecciona tu archivo inventario.csv');
      return;
    }
    
    // Preparamos el archivo para enviarlo
    const formData = new FormData();
    formData.append('file', archivo);

    try {
      // Aquí el frontend "toca la puerta" de tu backend en el puerto 8000
      const res = await fetch('http://127.0.0.1:8000/api/v1/inventario/cargar', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      setResultado(data);
    } catch (error) {
      alert('Error conectando al cerebro matemático: ' + error);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', background: '#f4f4f9', minHeight: '100vh', color: 'black' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>StockOptima - Prueba de Conexión 🚀</h2>
        <p>Sube tu archivo para que el motor en Python calcule el EOQ y el Stock de Seguridad.</p>
        
        <input 
          type="file" 
          accept=".csv, .xlsx"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)} 
          style={{ marginBottom: '20px', display: 'block' }}
        />
        
        <button 
          onClick={subirArchivo} 
          style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Procesar en el Backend
        </button>
        
        {resultado && (
          <div style={{ marginTop: '20px' }}>
            <h3>Resultados del Motor Matemático:</h3>
            <pre style={{ background: '#333', color: '#0f0', padding: '20px', borderRadius: '5px', overflowX: 'auto' }}>
              {JSON.stringify(resultado, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}