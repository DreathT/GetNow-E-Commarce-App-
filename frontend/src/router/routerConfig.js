import React from "react";
import { Routes, Route } from "react-router-dom";
import ProductDetails from "../components/product/ProductDetails";
import Home from "../components/Home";
import Login from "../components/auth/Login";
import Register from "../components/auth/Register";
import Profile from "../components/user/Profile";

function RouterConfig() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/self/profile" element={<Profile />} />
        </Routes>
    )
}

export default RouterConfig;