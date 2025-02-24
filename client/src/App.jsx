import { Route, Routes } from 'react-router-dom';
import Home from "./pages/Home/Home.jsx";
import SignIn from "./pages/SignIn/SignIn.jsx";
import Main from "./components/layout/Main.jsx";
import "antd/dist/reset.css";

import "./assets/styles/main.css";
import "./assets/styles/responsive.css";
import {Suspense} from "react";
import {ProtectedRoute} from "./ProtectedRoute.jsx";
import Filling from "./pages/Filling/Filling.jsx";

import TestList from "./pages/Testing/TestList.jsx";
import TestEditor from "./pages/Testing/TestEditor.jsx";
import Modules from "./pages/Modules/Modules.jsx";
import ModuleEditor from "./pages/Modules/ModuleEditor.jsx";
import PracticalList from "./pages/Practical/PracticalList.jsx";
import PracticalEditor from "./pages/Practical/PracticalEditor.jsx";
import GalleryList from "./pages/Gallery/GalleryList.jsx";
import Users from "./pages/Users/Users.jsx";
import SendingList from "./pages/Sending/SendingList.jsx";
import UserPage from "./pages/Admin/UserPage.jsx";
import LeaderBoard from "./pages/LeaderBoard/LeaderBoard.jsx";

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
            link: '/users',
            element: <ProtectedRoute element={<Main><Users/></Main>}/>,
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
            link: '/practical',
            element: <ProtectedRoute element={<Main><PracticalList/></Main>}/>,
        },
        {
            link: '/practical/:id',
            element: <ProtectedRoute element={<Main><PracticalEditor/></Main>}/>,
        },
        {
            link: '/videolibraries',
            element: <ProtectedRoute element={<Main><GalleryList/></Main>}/>,
        },
        {
            link: '/mailing',
            element: <ProtectedRoute element={<Main><SendingList/></Main>}/>,
        },
        {
            link: '/admins',
            element: <ProtectedRoute element={<Main><UserPage/></Main>}/>,
        },
        {
            link: '/leaderboard',
            element: <ProtectedRoute element={<Main><LeaderBoard/></Main>}/>,
        },
        {
            link: '*',
            element: <ProtectedRoute element={<Main><Home/></Main>}/>,
        }
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