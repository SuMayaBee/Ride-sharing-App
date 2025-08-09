import React, { useContext, useEffect, useState } from 'react'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const UserProtectWrapper = ({
    children
}) => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const { user, setUser } = useContext(UserDataContext)
    const [ isLoading, setIsLoading ] = useState(true)

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }

        console.log('UserProtectWrapper: Checking user authentication...')
        
        axios.get(`${import.meta.env.VITE_BASE_URL}/users/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            console.log('UserProtectWrapper: User authenticated successfully', response.data)
            if (response.status === 200) {
                setUser(response.data)
                setIsLoading(false)
            }
        })
            .catch(err => {
                console.log('UserProtectWrapper: Authentication failed', err.response?.status, err.response?.data)
                // Only redirect to login if it's actually an auth error, not a network error
                if (err.response?.status === 401) {
                    localStorage.removeItem('token')
                    navigate('/login')
                } else {
                    // For network errors, just set loading to false and keep user logged in
                    console.log('Network error, keeping user logged in')
                    setIsLoading(false)
                }
            })
    }, [ token, navigate ])

    if (isLoading) {
        return (
            <div>Loading...</div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}

export default UserProtectWrapper