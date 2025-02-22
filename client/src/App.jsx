import { Route, Routes } from 'react-router-dom';
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import Main from "./components/layout/Main.jsx";
import "antd/dist/reset.css";

import "./assets/styles/main.css";
import "./assets/styles/responsive.css";
import {Suspense} from "react";
import {ProtectedRoute} from "./ProtectedRoute.jsx";
import Filling from "./pages/Filling.jsx";

import TelegramUsers from "./pages/TelegramUsers/TelegramUsers.jsx";
import Support from "./pages/Support/Support.jsx";
import Chat from "./pages/Support/Chat.jsx";
import TestList from "./pages/Testing/TestList.jsx";
import TestEditor from "./pages/Testing/TestEditor.jsx";
import Modules from "./pages/Modules/Modules.jsx";
import ModuleEditor from "./pages/Modules/ModuleEditor.jsx";

function App() {
    const routes = [
        {
            link: '/sign-in',
            element: <ProtectedRoute element={<SignIn/>}/>,
        },
        {
            link: '/',
            element:<ProtectedRoute element={<Main><Home/></Main>}/>,
        },
        {
            link: '/filling',
            element: <ProtectedRoute element={<Main><Filling/></Main>}/>,
        },
        {
            link: '/userTelegram',
            element: <ProtectedRoute element={<Main><TelegramUsers/></Main>}/>,
        },
        {
            link: '/support',
            element: <ProtectedRoute element={<Main><Support/></Main>}/>,
        },
        {
            link: '/chat/:id',
            element: <ProtectedRoute element={<Main><Chat/></Main>}/>,
        },
        {
            link: '/tests',
            element: <ProtectedRoute element={<Main><TestList/></Main>}/>,
        },
        {
            link: '/tests/:id',
            element: <ProtectedRoute element={<Main><TestEditor/></Main>}/>,
        },
        {
            link: '/module',
            element: <ProtectedRoute element={<Main><Modules/></Main>}/>,
        },
        {
            link: '/module/:id',
            element: <ProtectedRoute element={<Main><ModuleEditor/></Main>}/>,
        },
        {
            link: '*',
            element: <ProtectedRoute element={<Main><Home/></Main>}/>,
        },
        // {
        //     link: '/',
        //     element: <ProtectedRoute element={<Dashboard />} />,
        // }
    ];
    return (
        <div className="App">
            <Routes>
                {routes.map(route => (
                    <Route
                        key={route.link}
                        path={route.link}
                        element={
                            <Suspense>
                                {route.element}
                            </Suspense>
                        }
                    />
                ))}
            </Routes>
        </div>
    );
}

export default App;