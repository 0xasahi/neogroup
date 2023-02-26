import React from 'react';
import './style.scss';

function GroupHome (props) {
    const {
        user, title, updated_at, absolute_url, id, group, created_at,
    } = props;

    return (
        <div className='group'>
            <div className='group-info'>
                <a href={absolute_url} className='group-title'>
                    {title}
                </a>
                <span className='group-description'>
                    ({user.mastodon_account.username} · {updated_at})
                </span>
            </div>
        </div>
    );
}

export default GroupHome;
