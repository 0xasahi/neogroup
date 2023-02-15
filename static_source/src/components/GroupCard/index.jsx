import React from 'react';
import './style.scss';

function GroupCard (props) {
    console.log(props);
    const {
        created_at,
        description,
        icon_url,
        id,
        name,
        updated_at,
    } = props;

    return (
        <div className='group-card'>
            <img className='group-card-avatar' src={
                (icon_url && ('/media/' + icon_url)) || '/static/img/logo_blue.png'
            } />
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
