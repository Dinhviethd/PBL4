import React from 'react'
import {Outlet} from 'react-router-dom'
import HeaderBar from "@/components/headers/Header"
const PublicLayout= () => {
    return (
    <div>
        <HeaderBar />
        PublicLayout
        <Outlet />
    </div>)

}
export default PublicLayout