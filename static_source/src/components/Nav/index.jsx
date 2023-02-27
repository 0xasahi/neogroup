import React, {useRef} from 'react';
import {isBrowser, useIsomorphicLayoutEffect} from '../../common/utils';
import './style.scss';

export const NavBar = (props) => {
    const path = isBrowser() ? location.pathname : '';
    const items = props;
    const menuItems = Object.values(items).map(([url, name]) => (
        <li>
            <a href={url} className={path === url ? 'active' : ''}>{name}</a>
        </li>))

    const navRef = useRef(null);
    const toggleIconRef = useRef(null);

    useIsomorphicLayoutEffect(() => {
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
            <div className="nav-wrapper">
                <a className="logo" href="/">
                    <img width={48} src="/static/img/logo_blue.png" alt="neogrp" />
                </a>
                <ul id="menu">
                    {menuItems}
                </ul>
            </div>
            <div className="menuIcon" ref={toggleIconRef}>
                <span className="icon icon-bars"></span>
                <span className="icon icon-bars overlay"></span>
            </div>

            <div className="overlay-menu" ref={navRef}>
                <ul id="menu">
                    {menuItems}
                </ul>
            </div>
        </div>
    );
}

export default NavBar;
