import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

// Example API fetch function
async function fetchTodos() {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5')
  if (!response.ok) throw new Error('Failed to fetch todos')
  return response.json()
}

export default function Home() {
  const [count, setCount] = useState(0)

  // Example usage of TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return (
    <div>
      <h1 className='text-3xl font-bold underline'>Home Page</h1>
      <p>Welcome to the AI Email Template application!</p>

      <div style={{ margin: '20px 0' }}>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2>Example: TanStack Query Data Fetching</h2>
        {isLoading && <p>Loading todos...</p>}
        {error && <p>Error: {error.message}</p>}
        {data && (
          <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            {data.map((todo: { id: number; title: string; completed: boolean }) => (
              <li key={todo.id}>
                {todo.title} - {todo.completed ? '✅' : '⏳'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ margin: '20px 0' }}>
        <Link to="/about">Go to About page</Link>
      </div>
    </div>
  )
}
