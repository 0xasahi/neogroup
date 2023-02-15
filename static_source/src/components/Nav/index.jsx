import React, {useRef, useEffect} from 'react';
import './style.scss';

export const NavBar = () => {
    const path = location.pathname;

    const items = [
        ['/', '首页'],
        ['https://neodb.social/', '书影音'],
        ['/group/create', '创建小组'],
        ['/login', '登录'],
    ]
    const menuItems = items.map(([url, name]) => (
        <li>
            <a href={url} class={path === url ? 'active' : ''}>{name}</a>
        </li>
    ))
    const navRef = useRef(null);
    const toggleIconRef = useRef(null);

    useEffect(() => {
        const nav = navRef.current;
        const toggleIcon = toggleIconRef.current;

        const handleClick = () => {
            if (nav.style.transform !== 'translateX(0%)') {
                nav.style.transform = 'translateX(0%)';
                nav.style.transition = 'transform 0.2s ease-out';
            } else {
                nav.style.transform = 'translateX(-100%)';
                nav.style.transition = 'transform 0.2s ease-out';
            }

            if (toggleIcon.className !== 'menuIcon toggle') {
                toggleIcon.className += ' toggle';
            } else {
                toggleIcon.className = 'menuIcon';
            }
        };

        toggleIcon.addEventListener('click', handleClick);

        return () => {
            toggleIcon.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <div className='nav-bar'>
            <div class="nav-wrapper">
                <a class="logo" href="/">
                    <img width={48} src="/static/img/logo_blue.png" alt="neogrp" />
                </a>
                <ul id="menu">
                    {menuItems}
                </ul>
            </div>
            <div class="menuIcon" ref={toggleIconRef}>
                <span class="icon icon-bars"></span>
                <span class="icon icon-bars overlay"></span>
            </div>

            <div class="overlay-menu" ref={navRef}>
                <ul id="menu">
                    {menuItems}
                </ul>
            </div>
        </div>
    );
}

export default NavBar;
