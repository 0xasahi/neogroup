import React from 'react';
import './style.scss';

function TopicCard (props) {
    const {
        user, title, updated_at, absolute_url, id, group, created_at,
    } = props;

    return (
        <div className='topic-card'>
            <div className='topic-card-info'>
                <a href={absolute_url} className='topic-card-title'>
                    {title}
                </a>
                <span className='topic-card-description'>
                    ({user.mastodon_account.username} · {updated_at})
                </span>
            </div>
        </div>
    );
}

export default TopicCard;
