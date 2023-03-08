import cx from "classnames";
import React, {useState, useRef, useEffect} from "react";
import {isBrowser, useIsomorphicLayoutEffect} from "../../common/utils";
import "./style.scss";

export const NavBar = (props) => {
    const {card, title, items} = props;
    const path = isBrowser() ? location.pathname : "";
    const menuItems = Object.values(items).map(([url, name]) => (
        <li>
            <a
                href={url}
                className={path === url ? "active" : ""}>
                {name}
            </a>
        </li>
    ));
    const [titleVisible, setTitleVisible] = useState(false);
    const navRef = useRef(null);
    const toggleIconRef = useRef(null);

    const listenToScroll = () => {
        if (window.scrollY > 80) {
            setTitleVisible(true);
        } else {
            setTitleVisible(false);
        }
    };

    useIsomorphicLayoutEffect(() => {
        window.addEventListener("scroll", listenToScroll);
        return () => window.removeEventListener("scroll", listenToScroll);
    });

    useEffect(() => {
        const nav = navRef.current;
        const toggleIcon = toggleIconRef.current;

        const handleClick = () => {
            if (nav.style.transform !== "translateX(0%)") {
                nav.style.transform = "translateX(0%)";
                nav.style.transition = "transform 0.2s ease-out";
            } else {
                nav.style.transform = "translateX(-100%)";
                nav.style.transition = "transform 0.2s ease-out";
            }

            if (toggleIcon.className !== "menuIcon toggle") {
                toggleIcon.className += " toggle";
            } else {
                toggleIcon.className = "menuIcon";
            }
        };

        toggleIcon.addEventListener("click", handleClick);

        return () => {
            toggleIcon.removeEventListener("click", handleClick);
        };
    }, []);

    return (
        <div className={cx("nav", {short: titleVisible})}>
            <div className='nav-wrapper'>
                <div class='nav-wrapper-left'>
                    {
                        card ? <a className={cx("nav-card", {show: !titleVisible})} href={card.url} >
                            <img className='nav-card-target' src={(card.icon && "/media/" + card.icon) || "/static/img/logo_blue.png"} />
                            <div className='nav-card-title'>
                                {card.name}
                                <div className="nav-card-subtitle">{'去看看'}</div>
                            </div>  </a> : <a className="logo" href="/">
                            <img src="/static/img/logo_blue.png" alt="neogrp" />
                        </a>
                    }
                    <div
                        className={cx("title", {show: titleVisible})}
                        onClick={() => {
                            window.scrollTo(0, 0);
                        }}>
                        {card && <div className={cx("up", {show: card})} />}
                        <div className='text'>{title} </div>
                    </div>
                </div>
                <ul id='menu'>{menuItems}</ul>
            </div>
            <div
                className='menuIcon'
                ref={toggleIconRef}>
                <span className='icon icon-bars'></span>
                <span className='icon icon-bars overlay'></span>
            </div>

            <div
                className='overlay-menu'
                ref={navRef}>
                <ul id='menu'>{menuItems}</ul>
            </div>
        </div>
    );
};

export default NavBar;
