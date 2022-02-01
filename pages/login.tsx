import React from 'react';
import Head from 'next/head';

const Index = () => {
    return <>
        <Head>
            <title>Sign In</title>
            <link rel="stylesheet" href="/css/base.css"/>
        </Head>
        <h1>Sign in</h1>
        <form action="/login/password" method="post">
            <section>
                <label htmlFor="username">Username</label>
                <input id="username" name="username" type="text" autoComplete="username" required autoFocus />
            </section>
            <section>
                <label htmlFor="current-password">Password</label>
                <input id="current-password" name="password" type="password" autoComplete="current-password" required />
            </section>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>" />
            <button type="submit">Sign in</button>
        </form>
        <hr />
        <p className="help">Don't have an account? <a href="/signup">Sign up</a></p>
    </>
}

export default Index