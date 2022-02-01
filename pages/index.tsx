import React from 'react';
import Head from 'next/head';

const Index = () => {
    return <>
        <Head>
            <title>Home</title>
            <link rel="stylesheet" href="/css/base.css"/>
        </Head>
        <header>
            <h1>todos</h1>
        </header>
        <section>
            <h2>todos helps you get things done</h2>
            <a className="button" href="/login">Sign in</a>
        </section>
    </>
}

export default Index