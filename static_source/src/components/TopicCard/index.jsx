import React from 'react';
import './style.scss';

const Bubble = ({number}) =>
    <svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4 2H20C21.1 2 22 2.9 22 4V16C22 17.1 21.1 18 20 18H6L2 22V4C2 2.9 2.9 2 4 2ZM5.17 16H20V4H4V17.17L5.17 16Z" fill="#6a5c89" />
        <text x="48%" y="46%" dominant-baseline="middle" text-anchor="middle" font-size="7" fill="#6a5c89">{number}</text>
    </svg>

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
