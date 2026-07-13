import './App.css'
import router from './router.jsx'
import { RouterProvider } from 'react-router-dom'
import { useLoading } from './contexts/LoadingContext.jsx'
import Loader from './components/common/ui/Loader.jsx'

function App () {
    const { isLoading } = useLoading()

    return (
        <>
            {isLoading && <Loader />}
            <RouterProvider router={router}></RouterProvider>
        </>
    )
}

export default App
