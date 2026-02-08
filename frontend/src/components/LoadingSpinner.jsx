import { Spinner } from 'react-bootstrap';

export default function LoadingSpinner({ darkMode, size = 'lg', text = 'Loading...' }) {
  return (
    <div 
      className="d-flex flex-column align-items-center justify-content-center py-5"
      style={{ minHeight: '200px' }}
    >
      <Spinner 
        animation="border" 
        size={size}
        className="mb-3"
        style={{ 
          color: darkMode ? '#667eea' : '#764ba2',
          width: size === 'lg' ? '3rem' : '2rem',
          height: size === 'lg' ? '3rem' : '2rem'
        }}
      />
      <p className={`mb-0 ${darkMode ? 'text-light' : 'text-muted'}`}>
        {text}
      </p>
    </div>
  );
}