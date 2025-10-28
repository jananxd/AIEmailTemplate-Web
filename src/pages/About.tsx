import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div>
      <h1 className='text-3xl font-bold underline'>About Page</h1>
      <p>This is a React application with:</p>
      <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '20px auto' }}>
        <li>React 19.1.1</li>
        <li>TypeScript</li>
        <li>Vite (with Rolldown)</li>
        <li>React Router v7</li>
        <li>TanStack Query v5</li>
      </ul>

      <div style={{ margin: '20px 0' }}>
        <Link to="/">Go back to Home</Link>
      </div>
    </div>
  )
}
