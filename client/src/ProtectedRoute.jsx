import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {useCookies} from "react-cookie";
import axios from "axios";
import {url} from "./Config";

export const ProtectedRoute = ({element}) => {

    const [cookies, removeCookie] = useCookies([]);
    const navigate = useNavigate();

    const {pathname} = useLocation()

    const [isLoggedIn, setLoggedIn] = useState(false)

    useEffect(() => {
        const loggedIn = async () => {

            if (!cookies.token || (!cookies.token && pathname !== "/sign-in") || (pathname !== '/sign-in' && !cookies.token)) {
                navigate("/sign-in");
            } else {
                const {data} = await axios.post(
                    `${url}/api/v1/admin/`,
                    {},
                    {withCredentials: true}
                );


                const {status} = data;

                if (status === false){
                    setLoggedIn(false)
                    navigate("/sign-in");
                } else if(pathname === "/sign-in"){
                    setLoggedIn(true)
                    navigate("/");
                }
            }
        };

        loggedIn();
    }, [cookies.token, isLoggedIn]);


        return element

};