import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppLayout } from "./components/layout/AppLayout";
import { Home } from "./pages/Home";
import { ErrorPage } from "./pages/ErrorPage";
import { Products } from "./pages/Products";
import { ProductDetails } from "./pages/ProductDeatils";
import { Contact } from "./pages/Contact";
import { Checkout } from "./pages/Checkout";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { About } from "./pages/About";
import { Cart } from "./pages/Cart";
import './App.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/product",
        element: <Products />,
      },
      {
        path: "/product/:productId",
        element: <ProductDetails />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/contact",
        element: <Contact />,
      },
      {
        path: "/cart",
        element: <Cart />,
      },
      {
        path: "/checkout",
        element: <Checkout />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
    ]
  }
])

const queryClient = new QueryClient();

const App = () => {
  return <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
}

export default App;