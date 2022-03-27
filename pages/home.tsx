import React from 'react';
import Head from 'next/head';

const Home = () => {
    return <>
        <Head>
            <title>Home</title>
            <link rel="stylesheet" href="/css/base.css"/>
        </Head>
        <header>
            <h1>Hello, you should be logged in</h1>
        </header>
    </>
}

export default Home