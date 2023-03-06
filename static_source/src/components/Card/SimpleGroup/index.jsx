import React from 'react';
import './style.scss';

function GroupCard (props) {
    const {
        description,
        icon_url,
        name,
        absolute_url
    } = props;

    return (
        <div className='group-card-simple'>
            <a href={absolute_url}>
                <img className='group-card-avatar'
                    src={
                        (icon_url && ('/media/' + icon_url)) || '/static/img/logo_blue.png'
                    } />
            </a>
            <div className='group-card-info'>
                <div className='group-card-name'>
                    {name}
                </div>
                <div className='group-card-description'>
                    {description}
                </div>
            </div>
        </div>
    );
}

export default GroupCard;
