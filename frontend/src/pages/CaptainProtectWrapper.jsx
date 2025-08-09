import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CaptainProtectWrapper = ({
    children
}) => {

    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const { captain, setCaptain } = useContext(CaptainDataContext)
    const [ isLoading, setIsLoading ] = useState(true)




    useEffect(() => {
        if (!token) {
            navigate('/captain-login')
            return
        }

        console.log('CaptainProtectWrapper: Checking captain authentication...')
        
        axios.get(`${import.meta.env.VITE_BASE_URL}/captains/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            console.log('CaptainProtectWrapper: Captain authenticated successfully', response.data)
            if (response.status === 200) {
                setCaptain(response.data.captain)
                setIsLoading(false)
            }
        })
            .catch(err => {
                console.log('CaptainProtectWrapper: Authentication failed', err.response?.status, err.response?.data)
                // Only redirect to login if it's actually an auth error, not a network error
                if (err.response?.status === 401) {
                    localStorage.removeItem('token')
                    navigate('/captain-login')
                } else {
                    // For network errors, just set loading to false and keep captain logged in
                    console.log('Network error, keeping captain logged in')
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

export default CaptainProtectWrapper